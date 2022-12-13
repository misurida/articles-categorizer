import { buildErrorMessage, generatePassword, PasswordInputEnhanced, requirements } from "./AuthForm";
import { IconCheck, IconUser, IconMail, IconLock, IconLogout } from "@tabler/icons";
import { TextInput, Group, Button, Modal, Tabs } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useTranslation } from "next-i18next";
import { FileInput } from "../input/MediaManager";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { useAuth } from "../../../hooks/useAuth";

/**
 * Display the authenticated user form to updated the user information. 
 * 
 * @returns 
 */
export function UserProfileForm() {

  const { t } = useTranslation()
  const { user, updateUserProfile, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<string | null>('details');

  const form = useForm({
    initialValues: {
      email: user?.email || '',
      displayName: user?.displayName || '',
      photoURL: user?.photoURL || ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : t('invalid_email')),
    }
  });
  const passwordForm = useForm({
    initialValues: {
      password: '',
    },
    validate: {
      password: (value) => {
        for (let i = 0; i < requirements.length; i++) {
          const req = requirements[i]
          if (!new RegExp(req.re).test(value)) {
            return t('the_password_is_not_strong_enough')
          }
        }
        return null;
      },
    }
  });

  const [loading, setLoading] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const updateProfile = async (values: any) => {
    try {
      setLoading(true);
      await updateUserProfile(values)
      setLoading(false)
      showNotification({ message: t('profile_updated'), color: "green", icon: <IconCheck size={18} /> })
    } catch (error: any) {
      const errors = buildErrorMessage(error, t)
      if (errors.email) form.setFieldError('email', errors.email)
      if (errors.password) passwordForm.setFieldError('password', errors.password)
      setLoading(false);
    }
  };

  const updatePassword = async (values: any) => {
    try {
      setLoadingPassword(true);
      await updateUserProfile({ password: values.password })
      setLoadingPassword(false)
      showNotification({ message: t('password_updated'), color: "green", icon: <IconCheck size={18} /> })
    } catch (error: any) {
      const errors = buildErrorMessage(error, t)
      if (errors.password) passwordForm.setFieldError('password', errors.password)
      setLoadingPassword(false);
    }
  };

  const randomPassword = () => {
    passwordForm.setFieldValue('password', generatePassword(16))
    setTimeout(() => {
      passwordForm.validate()
    }, 100)
  }

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setLoading(false);
      showNotification({ message: t('successfully_logged_out'), color: "green", icon: <IconCheck size={18} /> })
    } catch (error: any) {
      buildErrorMessage(error, t)
    }
  };

  const getUserFirstProviderId = () => {
    if ((user?.providerData.length || 0) > 0) {
      return user?.providerData[0].providerId
    }
    return null
  }

  return (
    <>
      <Tabs mt="md" value={activeTab} onTabChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="details">{t('details')}</Tabs.Tab>
          {getUserFirstProviderId() === "password" && (
            <Tabs.Tab value="credentials">{t('credentials')}</Tabs.Tab>
          )}
        </Tabs.List>
        <Tabs.Panel value="details" py="md">
          <form onSubmit={form.onSubmit(updateProfile)}>
            <FileInput
              label={t('profile_picture')}
              {...form.getInputProps('photoURL')}
            />
            <TextInput
              mt="sm"
              label={t('displayed_name')}
              placeholder={t('your_name')}
              icon={<IconUser size={16} />}
              {...form.getInputProps('displayName')}
            />

            <Group position="right" mt="md">
              <Button type="submit" color={Object.keys(form.errors).length > 0 ? 'red' : ''} loading={loading}>{t('update')}</Button>
            </Group>
          </form>
        </Tabs.Panel>
        {getUserFirstProviderId() === "password" && (
          <Tabs.Panel value="credentials" py="md">
            <form onSubmit={form.onSubmit(updateProfile)}>
              <TextInput
                mt="sm"
                label={t('email')}
                placeholder={t('your_email')}
                icon={<IconMail size={16} />}
                {...form.getInputProps('email')}
              />
              <Group mt="md">
                <Button
                  fullWidth
                  variant='outline'
                  onClick={() => { setShowChangePassword(true) }}
                  leftIcon={<IconLock />}
                >
                  {t('change_password')}
                </Button>
              </Group>

              <Group position="right" mt="md">
                <Button type="submit" color={Object.keys(form.errors).length > 0 ? 'red' : ''} loading={loading}>{t('update')}</Button>
              </Group>
            </form>
          </Tabs.Panel>
        )}
      </Tabs>
      <Button variant="default" onClick={handleLogout} fullWidth leftIcon={<IconLogout />}>{t('logout')}</Button>
      <Modal
        opened={showChangePassword}
        title={t('edit_password')}
        onClose={() => { setShowChangePassword(false) }}
      >
        <form onSubmit={passwordForm.onSubmit(updatePassword)}>
          <PasswordInputEnhanced form={passwordForm} />
          <Group position="right" mt="md">
            <Button variant='outline' onClick={randomPassword}>{t('randomize_password')}</Button>
            <Button type="submit" color={Object.keys(passwordForm.errors).length > 0 ? 'red' : ''} loading={loadingPassword}>{t('update_password')}</Button>
          </Group>
        </form>
      </Modal>
    </>
  )
}

export default UserProfileForm