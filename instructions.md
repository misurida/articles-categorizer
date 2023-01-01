# Keyword Relevance Scoring
The code in `keyword_handler.py` and `std_processors/classify_categories.py` outlines a rule-based scoring algorithm for determining the relevance score of an article with respect to a particular category based on keyword frequency and optional heuristics. It was designed with a few key points in mind:

- Articles consist of text organized in one or more sections (e.g. title, snippet, body). Articles are always assumed to have a title, but may not have a snippet and/or body.
- Different article sections carry more or less information. The scoring algorithm should differentially weight sections in configurable way.
- Text lengths may differ wildly between articles. Scores must not be biased towards shorter or longer articles.
- Articles span a variety of languages. Keyword classifiers should be easily translatable into other languages.
- Certain keywords may have a positive or negative impact on the relevance score for a particular category.
- Some keywords are only relevant in the context of other keywords.
- Keyword matching should be inherently robust to minor changes in the word form (e.g. plural/singular, conjugation, etc.). Some basic NLP techniques are needed here.
- Scores should be normalized to be interpretable and comparable.

# Text Preprocessing
In order to make the keyword search robust to slight variations in word form, a common text preprocessing pipeline is applied to both the keywords and the articles. This involves four main steps:

1. Symbol and special character removal
2. Stop-word removal$^*$
3. Lemmatization$^*$
4. Lower case

The steps marked with a $^*$ require a language-specific spaCy model with the relevant components. If such a model is not available for a given language, the steps are skipped.

The output of this preprocessing step can generally be accessed in the `article.out.process_sections` field.

# Python Implementation

## Keywords
Keywords (`Keyword`) represent the fundamental unit of search in the scoring algorithm. A `Keyword` instance is essentially a fancy `string` wrapper with some additional functionality built on top. The underlying keyword(s) can consist of a single word (e.g. `apple`) or a list of words separated by "`|`" to search for more than one word simultaneously in a logical OR fashion (e.g. `apple|banana`). The class instance also handles translation of the underlying keyword(s) to other languages.

## Keyword Groups
A keyword group (`KeywordGroup`) is quite simply a list of `Keyword` instances configured with some additional options. The list of keywords of the group define the set of words to be searched for in the article text. Importantly, the keyword group can modify this search in a few different ways:
1. Only search for keywords in the presence or absence of other keywords. This can be done by supplying additional keywords to one or more of the following: `must_contain_any`, `must_contain_all`, `must_not_contain`. Respectively, these require any, all, or none of the listed keywords to be found in conjunction with the primary keywords of the group.
2. Omit particular article sections from the keyword search. This can be done by specifying the sections to skip in the `restrict_sections` parameter.
3. Enforce a maximum relevance score if any of the keywords are found in the article title. This can be done by setting the `enforce_maximum` flag to `True`.
4. Set the relative group weight with the `restrict_sections` parameter. If left unset, it will be automatically inferred.

## Keyword Classifiers
Each individual classifier is defined within the context of a keyword handler (`KeywordHandler`) instance, which handles the complete scoring routine and multilingual functionality. The relevance scoring of each classifier is controlled by one or more `KeywordGroup` instances, which store the underlying keywords and other settings. The keyword classifier has two additional modifications to the scoring routine:
1. Differential scoring of sections by setting the `section_weights` parameter, specifying a floating point weight for each section. Weight normalization is automatically handled by the class.
2. An automatic bypass function set by the `bypass` parameter. This is a function that takes an `article` as argument and outputs a boolean. If the function return is `True`, the article is assigned the maximum relevance score in the classifier category and no keyword scoring is run. This allows for the automatic scoring of certain articles based on additional features (e.g. article source, scraper, entities...). 

**NOTE:** For a given handler group, the individual keyword group weights may be manually specified at the `KeywordGroup` level or automatically inferred at the `KeywordHandler` level. In the latter case, the groups are weighted based on their order defined in the `KeywordHandler` initialization, such that earlier groups are weighted higher than later groups. In either case, the weight normalization is automatically handled by the `KeywordHandler` class.

## Classifier Groups
Keyword classifiers are grouped together by theme and assigned to classifier group (`HandlerGroup`) instances. This abstraction provides a final layer of rules to the scoring algorithm that are applied to all `KeywordHandler` instances of a group. There is currently support for one such modification:
1. An automatic filter function set by the `filter` parameter. This is a function that takes the output of the entity extraction processor (`std_processors/link_relations.py`) as argument and outputs a boolean. If the function return is `True`, no keyword classifiers are run for the group (see `std_processors/classify_categories.py`). This effectively sets the relevance score to zero for all categories of a group if a particular set of entities are not found in the article.

## Universal Handler
For ease of implementation, all handler group instances are maintained by a singleton instance of the universal handler (`UniversalHandler`) class. This allows for easier iteration over all of the individual keyword classifiers during the scoring routine.

# Scoring Algorithm

## Overview
The relevance score $S$ of an article to a particular category is calculated as the normalized sum of two components:

1. the relative frequency score ($F$)
2. the absolute modification score ($M$)

such that the total score $S$ is defined as: 
$$S = max(0,\ min(F + M,\ S_{max}))$$
This score is squashed within the range $0 \to S_{max}$, where $S_{max}$ is the maximum relevance score defined for a particular project. The typical value of $S_{max}$ is $10$.

## Relative Frequency Score
The relative frequency score is a normalized score within the range $0 \to S_{max}$ based on combining the relative frequencies of individual keywords in an aggregate score. 

For a given keyword group consisting of $\ell$ keywords, the aggregate frequency score $f^{agg}$ is calculated as follows. Firstly, the absolute occurrence frequencies $f^{abs}$ are computed for each keyword in the article text. For an article consisting of $N$ words, these absolute frequencies are bounded in the range $0 \to N$. Secondly, a normalization function $Z(x)$ is applied in order to obtain relative frequencies $f$. There are a few options for this normalization function:
1. Divide by the number of words in the article $N$
$$Z(x) = \frac{x}{N}$$
2. Divide by the absolute frequency of the most commonly occurring word
$$Z(x) = \frac{x}{max(f^{abs})}$$
3. Divide by the mean absolute frequency of all words and squash to one
$$Z(x)= min \bigg( 1,\ \frac{x}{mean(f^{abs})} \bigg)$$
These relative frequencies are guaranteed to lie in range $0 \to 1$. The last option is preferred because it mitigates the effect of *vanishing frequencies* in longer or more verbose articles.
The total relative frequency is simply the sum of the individual keyword frequencies
$$f^{tot} = \sum_{k=1}^\ell f_k$$
which necessarily lies within the range $0 \to \ell$. Next the uniqueness is calculated, defined as the number of nonzero frequencies
$$f^{unq} = \sum_{k=1}^\ell [f_k > 0]$$
which must also lie within the range $0 \to \ell$. This is simply the number of keywords found at least once in the text. Finally, the aggregate frequency score is taken as the normalized average of these quantities
$$f^{agg} = \frac{f^{tot} + f^{unq}}{2\ell}$$
such that output lies within the range $0 \to 1$.

The total relative frequency score is calculated by looping over keyword groups, and for each group, looping over sections of the article. For each section, the algorithm calculates the aggregate frequency of keywords from the group in that section. If the section is the title of the article and the group has the `enforce_maximum` property set to `True`, the score is immediately set to the maximum possible score $S_{max}$. Otherwise, the relevance score is updated by adding the product of the group's weight, the section's weight, and the frequency of keywords in that section. Finally, the score is scaled by the maximum possible score and adjusted to account for any sections missing in the article.

A mathematical equation describing this algorithm can be written as follows, where $n_k$ is the number of keyword groups, $m$ is the number of sections in the article, $w^g_i$ is the weight of the $i^{th}$ keyword group, $w^s_j$ is the weight of the $j^{th}$ section, and $f^{agg}_{ij}$ is the aggregate frequency of keywords from the $i^{th}$ group in the $j^{th}$ section, respectively
$$F = \frac{S_{max}}{1 - \sum_{j \notin A} w^s_j} \cdot \sum_{i=1}^{n_k} \sum_{j=1}^m w^g_i \cdot w^s_j \cdot (f^{agg}_{ij} + 1)$$
where the group and section weights are both normalized to unity
$$\sum_{j=1}^{n_k} w^g_i = \sum_{j=1}^m w^s_i = 1$$

## Absolute Modification Score
The absolute modification score is an un-normalized score within the range $-\infty \to \infty$ based on aggregating the absolute weights of individual keywords found in the text.

The total modification score is calculated by looping over keyword modifier groups, and for each group, looping over sections of the article. In this case, however, the algorithm is much simpler. The modification score is incremented by the group weight if any words of the group are found in any section. The group weights are defined by the user and may be any positive or negative floating point value. 

A mathematical equation describing this algorithm can be written as follows, where $n_m$ is the number of modifier groups, $m$ is the number of sections in the article, $w^g_i$ is the weight of the $i^{th}$ modifier group, $w^s_j$ is the weight of the $j^{th}$ section, and $f^{total}_{ij}$ is the total frequency of keywords from the $i^{th}$ group in the $j^{th}$ section, respectively
$$M = \sum_{i=1}^{n_m} w^g_i \cdot \bigg[ \sum_{j=1}^m f^{tot}_{ij} > 0 \bigg]$$
where the equality checks if the total relative frequency of the keyword group is nonzero for any section of the article. Once again, the group weights are normalized to unity
$$\sum_{j=1}^{n_m} w^g_i = 1$$

## Summary
Putting everything together gives this lovely equation for the raw relevance score
$$R = \frac{S_{max}}{1 - \sum_{j \notin A} w^s_j} \cdot \sum_{i=1}^{n_k} \sum_{j=1}^m w^g_i \cdot w^s_j \cdot \bigg( \frac{f^{tot}_{ij} + f^{unq}_{ij}}{2\ell_i} + 1 \bigg) + \sum_{i=1}^{n_m} w^g_i \cdot \bigg[ \sum_{j=1}^m f^{tot}_{ij} > 0 \bigg]$$
which is normalized such that the relevance score $S$ lies within the range $0 \to S_{max}$
$$S = max(0,\ min(R,\ S_{max}))$$