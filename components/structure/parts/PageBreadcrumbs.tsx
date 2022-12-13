import { Box, Breadcrumbs, Button } from '@mantine/core';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

interface BreadcrumbsItem {
  title: string
  href: string
}

/**
 * Displays a bread crumb chain to come back to a previous page.
 * 
 * @param props 
 * @returns 
 */
export default function PageBreadcrumb(props: {
  /**
   * The breadcrumb items.
   */
  items?: BreadcrumbsItem[]
  /**
   * Custom labels.
   */
  labels?: { [key: string]: string }
  /**
   * Base page name.
   */
  basePage?: string
}) {

  const { t } = useTranslation()
  const router = useRouter()

  const buildItem = (name: string, index: number, fullpath: string) => {

    const paths = fullpath.split('/');

    // building the title
    let title = "..."
    if (name === "") {
      title = props.basePage || t('home')
    }
    else if (!!props.labels && props.labels[name]) {
      title = t(props.labels[name])
    }
    else {
      title = t(name)
    }

    // building the href
    let p = JSON.parse(JSON.stringify(paths));
    const href = index === 0 ? "/" : p.slice(0, index + 1).join('/')

    // returning
    return { title, href };
  }

  const getLink = (item: BreadcrumbsItem, index: number) => {
    return (
      <Button
        key={index}
        compact
        color={router.asPath === item.href ? "primary" : "gray"}
        variant={"subtle"}
        onClick={() => { router.push(item.href) }}
      >
        {item.title}
      </Button>
    )
  }

  const items = props.items ?
    props.items.map((item, index) => getLink(item, index)) :
    router.pathname === "/" ? [getLink(buildItem("", 0, router.asPath), 0)] :
      router.pathname.split('/').map((item, index) => getLink(buildItem(item, index, router.asPath), index))

  return (
    <Box mb="md">
      <Breadcrumbs>{items}</Breadcrumbs>
    </Box>
  )
}
