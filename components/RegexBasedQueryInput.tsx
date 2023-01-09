import { useState } from "react";

export interface TestBloc {
  type: "|" | "&",
  children: (TestBloc | string)[]
}

export default function RegexBasedQueryInput() {

  const codeT = "adipisicing&labore|((adipisicing|elit)&(distinctio|quis))"
  const [value, setValue] = useState(codeT);
  const lorem = "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ducimus labore et ratione distinctio eligendi illo earum facilis repudiandae quis voluptatibus nostrum nisi, officiis eius consectetur perferendis saepe iusto maiores eveniet?"


  const splitBy = (test: string, separator: string) => {
    const groups = []
    let index = 0
    let parCount = 0
    for (let i = 0; i < test.length; i++) {
      const c = test[i]
      if (c === "(") {
        if (parCount === 0) {
          index = i + 1
        }
        parCount++
      }
      else if (c === ")") {
        parCount--
        if (parCount === 0) {
          groups.push(test.slice(index, i))
          index = i + 1
        }
      }
      else if (c === separator && parCount === 0 && i > 0) {
        groups.push(test.slice(index, i))
        index = i + 1
      }
      if (i === test.length - 1) {
        groups.push(test.slice(index, test.length))
      }
    }
    if (parCount !== 0) {
      // TODO: handle error...
    }
    return groups.filter(e => !!e)
  }

  /**
   * Takes a code string and returns and object containing the split elements and the operations type
   * 
   * @param test 
   * @returns 
   */
  const splitCode = (test: string, type: TestBloc["type"], forceMap?: boolean): TestBloc | string => {
    const split = splitBy(test, type)
    if (split.length <= 1 && !forceMap) {
      return test
    }
    return {
      type: type,
      children: split.map(s => splitCode(s, type === "|" ? "&" : "|"))
    }
  }

  /**
   * Reserved characters: ( , ) , & , |
   * Regex characters: . , + , * , ? , ^ , $ , ( , ) , [ , ] , { , } , | , \
   * 
   * @param text 
   * @param test 
   * @returns 
   */
  const executeCode = (text: string, test: TestBloc | string): boolean => {
    // we check the string
    if (typeof test === "string") {
      const t = test.trim()
      // not test
      if (t.length > 0 && t[0] === "!") {
        const regex = new RegExp(`(?:^|\\s)${t.slice(1)}(?:$|\\s)`, 'gi')
        return !regex.test(text)
      }
      // regular test
      const regex = new RegExp(`(?:^|\\s)${t}(?:$|\\s)`, 'gi')
      return regex.test(text)
    }
    // we execute tests on children
    if (test.type === "|") {
      return test.children.some(c => executeCode(text, c))
    }
    return test.children.every(c => executeCode(text, c))
  }

  const test = () => {
    const sc = splitCode(value, "|", true) as TestBloc
    const res = executeCode(lorem, sc)
  }

  return (
    <div>RegexBasedQueryInput</div>
  )
}
