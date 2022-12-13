import { Group, ActionIcon, Box, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons";
import LanguageSelector from "./LanguageSelector";
import AuthForm from "../user/AuthForm";
import router from "next/router";

/**
 * Page layout actions, generally on the top right.
 * 
 * @returns 
 */
export default function HeaderActions() {

  const { toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return (
    <Group spacing={5}>
      {/* <LanguageSelector /> */}
      <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size="xl">
        {theme.colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoonStars size={16} />}
      </ActionIcon>
      {router.route !== "/login" && (
        <Box ml={5}>
          <AuthForm asMenu />
        </Box>
      )}
    </Group>
  )
}
