const fs = require('fs');
const path = 'd:\\projects\\AGBRAIN\\projects\\atlas\\mobile\\app\\(tabs)\\profile.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix 1: broken structure around line 284 - version text + orphan tags
c = c.replace(
  /\<Text style=\{styles\.versionText\}\>VEYRA · v1\.0\.0\<\/Text\>[\s\S]*?\<\/Modal\>\s*\<\/View\>\s*\<\/Modal\>/,
  `<Text style={styles.versionText}>VEYRA · v1.0.0</Text>
      </ScrollView>

      {/* ── Twin Viewer Modal (Premium) ── */}
      <Modal visible={twinModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setTwinModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your AI Avatar</Text>
              <View style={{width: 32}} />
            </View>
            <View style={styles.modalImageContainer}>
              {user?.digitalTwinUrl && (
                <Image source={{ uri: user.digitalTwinUrl }} style={styles.fullTwinImage} resizeMode="contain" />
              )}
            </View>
            <View style={{paddingHorizontal: 20, paddingBottom: 30, paddingTop: 16, backgroundColor: '#FFF'}}>
              <TouchableOpacity
                style={styles.premiumPrimaryBtn}
                onPress={() => { setTwinModalVisible(false); setTwinGuidelinesVisible(true); }}
              >
                <Ionicons name="refresh" size={18} color="#FFF" style={{marginRight: 8}} />
                <Text style={styles.premiumBtnTextWhite}>Update Avatar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>`
);

// Fix 2: Remove duplicate </ScrollView> if any
const scrollCloseCount = (c.match(/<\/ScrollView>/g) || []).length;
if (scrollCloseCount > 1) {
  // remove the first extra one
  let found = 0;
  c = c.replace(/<\/ScrollView>/g, (match) => {
    found++;
    return found > 1 ? '' : match;
  });
}

fs.writeFileSync(path, c, 'utf8');
console.log('Fix 2 applied! ScrollView closes:', (c.match(/<\/ScrollView>/g)||[]).length);
