import { IconBrandGoogle, IconCheck, IconChevronLeft, IconChevronRight, IconLock, IconLogout, IconMail, IconUserCircle, IconUserPlus, IconX } from '@tabler/icons';
import { Button, Box, Group, Tabs, TextInput, Text, PasswordInput, Popover, Progress, Menu, Avatar, useMantineTheme } from '@mantine/core';
import { MouseEventHandler, useEffect, useState } from 'react';
import { useForm, UseFormReturnType } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { AuthError, User } from 'firebase/auth';
import { buildInitials } from '../../../utils/helpers';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';

export interface PasswordRequirementItem {
  re: RegExp
  label: string
}

/**
 * Return a text line representing a password condition.
 * 
 * @param props
 * @returns 
 */
export function PasswordRequirement({ meets, label }: {
  /**
   * If the requirement is fulfilled.
   */
  meets: boolean;
  /**
   * Condition text to display.
   */
  label: string
}) {
  return (
    <Text
      color={meets ? 'teal' : 'red'}
      sx={{ display: 'flex', alignItems: 'center' }}
      mt={7}
      size="sm"
    >
      {meets ? <IconCheck color="teal" /> : <IconX color="red" />} <Box ml={10}>{label}</Box>
    </Text>
  );
}

/**
 * The password requirements.
 */
export const requirements: PasswordRequirementItem[] = [
  { re: /[0-9]/, label: 'Includes number' },
  { re: /[a-z]/, label: 'Includes lowercase letter' },
  { re: /[A-Z]/, label: 'Includes uppercase letter' },
  { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbols' },
];

/**
 * Build number representing the password strength.
 * 
 * @param password The password string.
 * @returns The strength score.
 */
export function getStrength(password: string) {
  let multiplier = password.length > 5 ? 0 : 1;
  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });
  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

/**
 * Generate a random password of a given size.
 * 
 * @param length The password size.
 * @returns The password generated.
 */
export function generatePassword(length = 8) {
  const keys = {
    upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowerCase: "abcdefghijklmnopqrstuvwxyz",
    number: "01234567890123456789",
    symbol: "$&+,:;=?@#|'<>.^*()%!-"
  }
  const getKey = [
    function upperCase() {
      return keys.upperCase[Math.floor(Math.random() * keys.upperCase.length)];
    },
    function lowerCase() {
      return keys.lowerCase[Math.floor(Math.random() * keys.lowerCase.length)];
    },
    function number() {
      return keys.number[Math.floor(Math.random() * keys.number.length)];
    },
    function symbol() {
      return keys.symbol[Math.floor(Math.random() * keys.symbol.length)];
    }
  ];
  let password = "";
  while (length - 4 > password.length) {
    let keyToAdd = getKey[Math.floor(Math.random() * getKey.length)];
    password += keyToAdd();
  }
  for (let i = 0; i < 4; i++) {
    password += getKey[i]()
  }
  return password;
}

/**
 * Password error messages.
 */
export const passwordErrorMessages = {
  "auth/email-already-in-use": {
    short: "email_already_in_use",
    i18n: 'email_already_in_use_msg',
    target: "email"
  },
  "auth/user-not-found": {
    short: "user_not_found",
    i18n: 'user_not_found_msg',
    target: "email"
  },
  "auth/weak-password": {
    short: "weak_password",
    i18n: 'weak_password_msg',
    target: "password"
  },
  "auth/wrong-password": {
    short: "wrong_password",
    i18n: 'wrong_password_msg',
    target: "password"
  }
} as const

export const buildErrorMessage = (e: AuthError) => {
  const defaultMessage = `Authentication error (${e.code})`
  const code = e.code as keyof typeof passwordErrorMessages
  const msg = passwordErrorMessages[code] || {}
  showNotification({ message: `defaultMessage`, color: "red", icon: <IconX size={18} /> })
  if (msg.target === "password") {
    return { password: defaultMessage };
  }
  else {
    return { email: defaultMessage };
  }
}


/**
 * User short display.
 * 
 * @param props 
 * @returns 
 */
export function UserInfo(props: {
  /**
   * Callback triggered when the element is clicked.
   */
  onClick?: MouseEventHandler<HTMLDivElement> | undefined
  /**
   * Changes the style if the menuStyle is activated.
   */
  menuStyle?: boolean
  /**
   * The user to display information from.
   */
  user?: User | null
}) {

  const theme = useMantineTheme();
  const profilePicture = props.user?.photoURL || props.user?.providerData[0].photoURL || undefined

  return (
    <Box onClick={props.onClick}>
      <Group noWrap style={{ gap: 10 }}>
        <Avatar
          src={profilePicture}
          size="lg"
          radius="xl"
        />
        <Box sx={{ flex: 1 }}>
          <Text
            size="sm"
            weight={500}
            style={props.menuStyle ? { textOverflow: 'ellipsis', overflow: 'hidden', width: 150 } : {}}
            title={props.user?.displayName || ''}
          >
            {props.user?.displayName}
          </Text>
          {!props.user && (
            <>
              <Link href="/login">
                <Text size="sm" weight={500}>Account</Text>
              </Link>
              <Text color="dimmed" size="xs">Login or subscribe</Text>
            </>
          )}
          {props.user?.email && (
            <Text
              color="dimmed"
              size="xs"
              style={props.menuStyle ? { textOverflow: 'ellipsis', overflow: 'hidden', width: 150 } : {}}
              title={props.user?.email}
            >
              {props.user?.email}
            </Text>
          )}
        </Box>
        {!props.user?.email && (theme.dir === 'ltr' ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />)}
      </Group>
    </Box>
  );
}


/**
 * For to perform a login.
 * 
 * @param props 
 * @returns 
 */
export function LoginForm(props: {
  /**
   * If a cancel button should be display, defined the button.
   */
  cancelButton?: React.ReactNode
  /**
   * Callback after the login succeeded.
   */
  onLogin?: () => void
}) {


  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const { login } = useAuth()
  const [loading, setLoading] = useState(false);

  const onLogin = async (values: any) => {
    try {
      setLoading(true);
      await login(values.email, values.password)
      setLoading(false)
      if (props.onLogin) {
        props.onLogin()
      }
      showNotification({ message: "Logged in", color: "green", icon: <IconCheck size={18} /> })
    } catch (error: any) {
      const errors = buildErrorMessage(error)
      if (errors.email) form.setFieldError('email', errors.email)
      if (errors.password) form.setFieldError('password', errors.password)
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(onLogin)}>
      <TextInput
        required
        label={"Email"}
        placeholder={"Your email"}
        icon={<IconMail size={16} />}
        {...form.getInputProps('email')}
      />
      <PasswordInput
        mt="sm"
        required
        label={"Password"}
        placeholder={"Your password"}
        icon={<IconLock size={16} />}
        {...form.getInputProps('password')}
      />
      <Group position="right" mt="md">
        {props.cancelButton}
        <Button type="submit" color={Object.keys(form.errors).length > 0 ? 'red' : ''} loading={loading}>{"Login"}</Button>
      </Group>
    </form>
  )
}

/**
 * For to perform a subscription.
 * 
 * @param props 
 * @returns 
 */
export function SubscribeForm(props: {
  /**
   * If a cancel button should be display, defined the button.
   */
  cancelButton?: React.ReactNode
}) {

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => {
        for (let i = 0; i < requirements.length; i++) {
          const req = requirements[i]
          if (!new RegExp(req.re).test(value)) {
            return "The password is not strong enough"
          }
        }
        return null;
      },
      confirmPassword: (value, values) =>
        value !== values.password ? "The passwords are not similar" : null,
    },
  });

  const { signup } = useAuth()
  const [loading, setLoading] = useState(false);

  const onSubscribe = async (values: any) => {
    try {
      setLoading(true);
      await signup(values.email, values.password)
      setLoading(false)
      showNotification({ message: "Account created", color: "green", icon: <IconCheck size={18} /> })
    } catch (error: any) {
      const errors = buildErrorMessage(error)
      if (errors.email) form.setFieldError('email', errors.email)
      if (errors.password) form.setFieldError('password', errors.password)
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(onSubscribe)}>
      <TextInput
        required
        label={"Email"}
        placeholder={"Your email"}
        icon={<IconMail size={16} />}
        {...form.getInputProps('email')}
      />
      <PasswordInputEnhanced form={form} required />
      <PasswordInput
        mt="sm"
        required
        label={"Confirm password"}
        placeholder={"Confirm password"}
        icon={<IconLock size={16} />}
        {...form.getInputProps('confirmPassword')}
      />
      <Group position="right" mt="md">
        {props.cancelButton}
        <Button type="submit" color={Object.keys(form.errors).length > 0 ? 'red' : ''} loading={loading}>{"Subscribe"}</Button>
      </Group>
    </form>
  )
}


export function PasswordInputEnhanced({ form, required }: {
  /**
   * The form the get the password from.
   */
  form: UseFormReturnType<any>
  /**
   * If the field is required.
   */
  required?: boolean
}) {

  const strength = getStrength(form.values.password);
  const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';
  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement key={index} label={requirement.label} meets={requirement.re.test(form.values.password)} />
  ));

  return (
    <Popover
      position="bottom-start"
      withArrow
      trapFocus={false}
      transition="pop-top-left"
    >
      <Popover.Target>
        <PasswordInput
          required={required}
          mt="sm"
          label={"Password"}
          placeholder={"Your password"}
          icon={<IconLock size={16} />}
          description={"Strong password required"}
          {...form.getInputProps('password')}
        />
      </Popover.Target>
      <Popover.Dropdown>
        <Progress color={color} value={strength} size={5} style={{ marginBottom: 10 }} />
        <PasswordRequirement label={"Includes at least 6 characters"} meets={form.values.password.length > 5} />
        {checks}
      </Popover.Dropdown>
    </Popover>
  )
}

/**
 * Main login component, displays the user information and the needed auth forms.
 * If the url parameter 'action' is "subscribe", changes the default selected form.
 * 
 * @param props 
 * @returns 
 */
export function AuthForm(props: {
  /**
   * When the back button is clocked or the action cancelled.
   * 
   * @returns 
   */
  onBack?: () => void
  /**
   * If the components should be displayed as menu, for the header.
   */
  asMenu?: boolean
}) {

  const [loading, setLoading] = useState(false)
  const { user, logout, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [showLoginWithEmail, setShowLoginWithEmail] = useState(false)
  const [showMenu, setShowMenu] = useState(false);
  const profilePicture = user?.photoURL || user?.providerData[0].photoURL || undefined
  const [activeTab, setActiveTab] = useState<string | null>('login');

  useEffect(() => {
    if (router.query.action === "subscribe") {
      setActiveTab('subscribe')
    }
    else {
      setActiveTab('login')
    }
  }, [router])

  const cancel = () => {
    setShowMenu(false)
  }

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      cancel()
      router.push("/");
      setLoading(false);
      showNotification({ message: "Successfully logged out", color: "green", icon: <IconCheck size={18} /> })
    } catch (error: any) {
      buildErrorMessage(error)
    }
  };

  const loginGoogle = async () => {
    try {
      await loginWithGoogle();
      showNotification({ message: "Successfully logged in with Google", color: "green", icon: <IconCheck size={18} /> })
      cancel()
    }
    catch (e) {
      showNotification({ message: 'Login process cancelled' })
    }
  }

  const onBack = () => {
    if (props.onBack) {
      props.onBack();
    }
  }

  const goToMyProfile = () => {
    router.push("/login")
  }

  const goToMySubscribe = () => {
    router.push("/login?action=subscribe")
  }

  if (props.asMenu) {
    return (
      <Menu width={220} closeOnItemClick={false} shadow="md" position="bottom-end" opened={showMenu} onChange={setShowMenu}>
        <Menu.Target>
          <Avatar sx={{ cursor: "pointer" }} src={profilePicture} radius="xl">
            {user?.displayName ? buildInitials(user.displayName) : <IconUserCircle />}
          </Avatar>
        </Menu.Target>
        <Menu.Dropdown>
          {!!user ? (
            <>
              <Menu.Label style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ opacity: 0.5 }}>Logged as</span>
                <span onClick={() => console.dir(user)}>{user.displayName}</span>
              </Menu.Label>
              <Menu.Item onClick={goToMyProfile} icon={<IconUserCircle size={14} />}>My profile</Menu.Item>
              <Menu.Item onClick={handleLogout} icon={<IconLogout size={14} />}>Logout</Menu.Item>
            </>
          ) : (
            <>
              <Menu.Label>Unauthenticated</Menu.Label>
              <Menu.Item onClick={loginGoogle} icon={<IconBrandGoogle size={14} />}>Login with Google</Menu.Item>
              <Menu.Item onClick={() => setShowLoginWithEmail(v => !v)} icon={<IconMail size={14} />}>Login with email</Menu.Item>
              {showLoginWithEmail && (
                <Box p="sm">
                  <LoginForm onLogin={cancel} />
                </Box>
              )}
              <Menu.Item onClick={goToMySubscribe} icon={<IconUserPlus size={14} />}>Subscribe</Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    )
  }

  return (
    <>
      <Box mb="lg">
        <Button
          onClick={loginGoogle}
          loading={loading}
          fullWidth
          leftIcon={<IconBrandGoogle />}
        >
          Login with Google
        </Button>
      </Box>
      <Tabs value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="login">Login</Tabs.Tab>
          <Tabs.Tab value="subscribe">Create account</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="login" pt="xs">
          <LoginForm cancelButton={!!props.onBack ? <Button variant="default" onClick={onBack}>Back</Button> : null} />
        </Tabs.Panel>
        <Tabs.Panel value="subscribe" pt="xs">
          <SubscribeForm cancelButton={!!props.onBack ? <Button variant="default" onClick={onBack}>Back</Button> : null} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}

export default AuthForm