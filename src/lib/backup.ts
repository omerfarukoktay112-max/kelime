import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Yedeği bir JSON dosyasına yazar ve paylaşım menüsünü açar
 * (Drive'a, Dosyalar'a kaydet, kendine mesaj at vb.).
 */
export async function shareBackup(json: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda dosya paylaşımı desteklenmiyor.');
  const file = new File(Paths.cache, `kelime-yedek-${new Date().toISOString().slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Kelime yedeğini kaydet',
  });
}

/** Kullanıcıya bir yedek dosyası seçtirir ve içeriğini döner. Vazgeçerse null. */
export async function pickBackup(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return new File(res.assets[0].uri).text();
}
