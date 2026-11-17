import { reloadAppAsync } from 'expo';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AppColors, AppStyles } from '@/constants/theme';
import { collectProfileBackup, stageProfileRestore } from '@/lib/profile-backup';
import {
  getProfileBackup, ProfileRequestError, profileServiceReady, requestProfileCode,
  saveProfileBackup, verifyProfileCode, type ProfileSession, type RemoteBackup,
} from '@/lib/profile-service';
import { useI18n } from '@/store/i18n';
import { profileCopy } from '@/store/profile-copy';

export default function ProfileBackupSection() {
  const { language, t } = useI18n();
  const copy = profileCopy[language];
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [session, setSession] = useState<ProfileSession | null>(null);
  const [backup, setBackup] = useState<RemoteBackup | null | undefined>();
  const [confirm, setConfirm] = useState<'replace' | 'restore' | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const inProgress = useRef(false);
  const address = email.trim();

  function signOut() {
    setSession(null);
    setBackup(undefined);
    setEmail('');
    setCode('');
    setCodeRequested(false);
    setConfirm(null);
    setNotice(null);
  }

  async function run(action: () => Promise<void>, verifying = false) {
    if (inProgress.current) return;
    inProgress.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      const status = error instanceof ProfileRequestError ? error.status : 0;
      let text = copy.error;
      if (status === 429) text = copy.wait;
      else if (verifying && (status === 400 || status === 401 || status === 403 || status === 422)) text = copy.codeError;
      else if (status === 401) {
        signOut();
        text = copy.expired;
      } else if (status === 409) {
        setBackup(undefined);
        setConfirm(null);
        text = copy.stale;
      }
      setNotice({ text, error: true });
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  }

  function sendCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return;
    void run(async () => {
      await requestProfileCode(address);
      setCode('');
      setCodeRequested(true);
      setNotice({ text: copy.codeSent });
    });
  }

  function verify() {
    if (!/^\d{6,10}$/.test(code)) return;
    void run(async () => {
      const active = await verifyProfileCode(address, code);
      setSession(active);
      setCode('');
    }, true);
  }

  function refresh(active: ProfileSession) {
    void run(async () => setBackup(await getProfileBackup(active)));
  }

  function upload(active: ProfileSession, previous: RemoteBackup | null) {
    setConfirm(null);
    void run(async () => {
      const local = await collectProfileBackup();
      setBackup(await saveProfileBackup(active, local, previous));
      setNotice({ text: copy.uploaded });
    });
  }

  function restore(copyToRestore: RemoteBackup) {
    setConfirm(null);
    void run(async () => {
      await stageProfileRestore(copyToRestore.snapshot);
      await reloadAppAsync('Restore ChefSuggest backup');
    });
  }

  function action(label: string, onPress: () => void, disabled = false, secondary = false) {
    return (
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy || disabled }}
        disabled={busy || disabled} onPress={onPress}
        style={[AppStyles.button, secondary && styles.secondary, (busy || disabled) && styles.disabled]}>
        <Text style={AppStyles.buttonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>{copy.account}</Text>
      <Text style={styles.hint}>{copy.accountHint}</Text>
      {!profileServiceReady ? <Text style={styles.hint}>{copy.offline}</Text> : !session ? (
        <>
          <TextInput accessibilityLabel={copy.email} placeholder={copy.email} placeholderTextColor={AppColors.textLight}
            style={AppStyles.input} inputMode="email" autoCapitalize="none" autoCorrect={false}
            autoComplete="email" maxLength={254} value={email} onChangeText={setEmail} editable={!busy && !codeRequested} />
          {codeRequested ? (
            <>
              <TextInput accessibilityLabel={copy.code} placeholder={copy.code} placeholderTextColor={AppColors.textLight}
                style={AppStyles.input} inputMode="numeric" autoComplete="one-time-code" maxLength={10}
                value={code} onChangeText={text => setCode(text.replace(/\D/g, ''))} editable={!busy} />
              {action(copy.verify, verify, code.length < 6)}
              {action(copy.sendCode, sendCode, false, true)}
              {action(copy.changeEmail, signOut, false, true)}
            </>
          ) : action(copy.sendCode, sendCode, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))}
        </>
      ) : (
        <>
          <Text style={styles.address}>{session.email}</Text>
          {backup === undefined ? action(notice?.error ? copy.retry : copy.load, () => refresh(session)) : (
            <>
              <Text style={styles.hint}>{backup
                ? copy.last(new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(backup.savedAt)))
                : copy.empty}</Text>
              {!confirm ? (
                <>
                  {action(copy.upload, () => backup ? setConfirm('replace') : upload(session, null))}
                  {backup && action(copy.download, () => setConfirm('restore'), false, true)}
                  <Text style={styles.hint}>{copy.manual}</Text>
                </>
              ) : backup && (
                <View style={styles.confirm}>
                  <Text style={styles.hint}>{copy[confirm]}</Text>
                  {confirm === 'replace'
                    ? action(copy.upload, () => upload(session, backup))
                    : action(copy.download, () => restore(backup))}
                  {action(t.cancel, () => setConfirm(null), false, true)}
                </View>
              )}
            </>
          )}
          {action(copy.exit, signOut, false, true)}
        </>
      )}
      {notice && <Text accessibilityLiveRegion="polite" accessibilityRole={notice.error ? 'alert' : undefined}
        style={[styles.hint, notice.error && styles.error]}>{notice.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...AppStyles.card, padding: 14, gap: 10 },
  heading: { color: AppColors.text, fontWeight: '700', fontSize: 18 },
  hint: { color: AppColors.textLight, fontSize: 14, lineHeight: 20 },
  address: { color: AppColors.text, fontWeight: '600', fontSize: 15 },
  error: { color: AppColors.expired },
  disabled: { opacity: 0.5 },
  secondary: { backgroundColor: AppColors.limeTint },
  confirm: { padding: 10, backgroundColor: AppColors.warmTint, borderRadius: 12, gap: 8 },
});
