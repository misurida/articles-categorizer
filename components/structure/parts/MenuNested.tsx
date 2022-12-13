import { MenuLink, UserMeta } from "../../../types/shell";
import { useTranslation } from "next-i18next";
import { CSSProperties } from "react";
import { useFirestore } from "../../../hooks/useFirestore";
import { useRouter } from "next/router";
import { NavLink } from "@mantine/core";
import { useAuth } from "../../../hooks/useAuth";
import Link from "next/link";


/**
 * Build a single menu link that can contain children items.
 * 
 * @param props 
 * @returns 
 */
export function MenuLink(props: MenuLink) {

  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuth()
  const { currentUsermeta } = useFirestore()

  if (props.auth === true && !user?.uid) {
    return null;
  }
  if (props.auth === false && !!user?.uid) {
    return null;
  }
  if (!!props.role && !props.role.includes(currentUsermeta?.role || "" as UserMeta["role"])) {
    return null;
  }

  if (props.to) {
    return (
      <Link href={props.to} passHref>
        <NavLink
          color={props.color}
          component="a"
          label={t(props.label)}
          active={router.pathname == props.to}
          icon={props.icon}
          rightSection={props.rightSection}
          style={props.style}
        >
          {!!props.children && props.children.map(l => (
            <MenuLink
              key={l.to || l.label}
              icon={l.icon}
              color={l.color}
              label={t(l.label)}
              to={l.to}
              auth={l.auth}
              role={l.role}
              rightSection={l.rightSection}
            />
          ))}
        </NavLink>
      </Link>
    )
  }

  return (
    <NavLink
      label={t(props.label)}
      icon={props.icon}
      color={props.color}
    >
      {!!props.children && props.children.map(l => (
        <MenuLink
          key={l.label}
          icon={l.icon}
          color={l.color}
          label={t(l.label)}
          to={l.to}
          auth={l.auth}
          role={l.role}
          rightSection={l.rightSection}
        />
      ))}
    </NavLink>
  )
}

/**
 * Build a nested menu from an array of menu links
 * 
 * @param props 
 * @returns 
 */
export default function MenuNested(props: {
  /**
   * The menu links
   */
  links: MenuLink[]
  /**
   * If the links should be displayed horizontally instead of vertically.
   */
  horizontal?: boolean
  /**
   * Style given to the individual links.
   */
  style?: CSSProperties
}) {
  const { t } = useTranslation()

  return (
    <div style={props.horizontal ? { display: "flex", marginRight: "auto" } : undefined}>
      {props.links.map(link => (
        <MenuLink
          key={link.label}
          icon={link.icon}
          color={link.color}
          label={t(link.label)}
          to={link.to}
          auth={link.auth}
          role={link.role}
          rightSection={link.rightSection}
          style={props.style}
        >
          {link.children}
        </MenuLink>
      ))}
    </div>
  );
}
