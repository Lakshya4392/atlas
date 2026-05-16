const fs = require('fs');
const path = 'd:\\projects\\AGBRAIN\\projects\\atlas\\mobile\\app\\(tabs)\\profile.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add states
content = content.replace(
  `const [twinModalVisible, setTwinModalVisible] = useState(false);`,
  `const [twinModalVisible, setTwinModalVisible] = useState(false);\n  const [twinGuidelinesVisible, setTwinGuidelinesVisible] = useState(false);\n  const [premiumError, setPremiumError] = useState({visible: false, message: ''});`
);

// 2. Update handleGenerateDigitalTwin
content = content.replace(
  /Alert\.alert\(\s*"Create AI Twin"[\s\S]*?\]\s*\);\s*\};/,
  `setTwinModalVisible(false);\n    setTwinGuidelinesVisible(true);\n  };`
);

// 3. Update pickImage
content = content.replace(
  /const pickImage = async \(source: 'camera' \| 'gallery'\) => \{/,
  `const pickImage = async (source: 'camera' | 'gallery') => {\n    setTwinGuidelinesVisible(false);`
);

content = content.replace(
  /alert\('Sorry, we need camera permissions to make this work!'\);/,
  `setPremiumError({ visible: true, message: 'We need camera permissions to make this work!' });`
);

content = content.replace(
  /alert\('Digital Twin generated successfully!'\);/,
  `// alert('Digital Twin generated successfully!');`
);

content = content.replace(
  /alert\('Failed to generate Digital Twin: ' \+ data\.error\);/,
  `if (data.error && data.error.includes("VALIDATION_ERROR:")) {\n            const cleanError = data.error.replace("VALIDATION_ERROR:", "").trim();\n            setPremiumError({ visible: true, message: cleanError });\n          } else {\n            setPremiumError({ visible: true, message: data.error || 'Failed to process image' });\n          }`
);

content = content.replace(
  /alert\('Network error while generating Digital Twin\.'\);/,
  `setPremiumError({ visible: true, message: 'Network error while generating Digital Twin.' });`
);

// 4. Update the "Update" button inside twin modal
content = content.replace(
  /onPress=\{\(\) => \{\s*setTwinModalVisible\(false\);\s*handleGenerateDigitalTwin\(true\);\s*\}\}/,
  `onPress={() => { \n                  setTwinModalVisible(false); \n                  setTwinGuidelinesVisible(true); \n                }}`
);

// 5. Add Modals before </SafeAreaView>
const modalsHtml = `
      {/* ── Guidelines Onboarding Modal ── */}
      <Modal visible={twinGuidelinesVisible} transparent={true} animationType="fade">
        <View style={styles.guidelinesOverlay}>
          <View style={styles.guidelinesCard}>
             <TouchableOpacity style={styles.guidelinesClose} onPress={() => setTwinGuidelinesVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
             </TouchableOpacity>
             
             <View style={styles.guidelinesIconHeader}>
                <Ionicons name="body-outline" size={42} color="#1A1A1A" />
             </View>
             
             <Text style={styles.guidelinesTitle}>Create Your Avatar</Text>
             <Text style={styles.guidelinesSub}>For the most accurate Virtual Try-On, please follow these rules:</Text>

             <View style={styles.rulesList}>
                <View style={styles.ruleItem}>
                   <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                   <Text style={styles.ruleText}>Stand perfectly straight</Text>
                </View>
                <View style={styles.ruleItem}>
                   <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                   <Text style={styles.ruleText}>Ensure your Full Body is visible</Text>
                </View>
                <View style={styles.ruleItem}>
                   <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                   <Text style={styles.ruleText}>Good lighting & plain background</Text>
                </View>
             </View>

             <View style={styles.guidelinesActions}>
                <TouchableOpacity style={styles.premiumPrimaryBtn} onPress={() => pickImage('gallery')}>
                   <Ionicons name="images" size={20} color="#FFF" style={{marginRight: 8}} />
                   <Text style={styles.premiumBtnTextWhite}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.premiumSecondaryBtn} onPress={() => pickImage('camera')}>
                   <Ionicons name="camera" size={20} color="#1A1A1A" style={{marginRight: 8}} />
                   <Text style={styles.premiumBtnTextDark}>Camera</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

      {/* ── Premium Error Toast ── */}
      {premiumError.visible && (
         <View style={styles.premiumErrorOverlay}>
            <View style={styles.premiumErrorCard}>
               <Ionicons name="alert-circle" size={42} color="#E74C3C" />
               <Text style={styles.premiumErrorTitle}>Oops! Invalid Photo</Text>
               <Text style={styles.premiumErrorMsg}>{premiumError.message}</Text>
               <TouchableOpacity 
                 style={styles.premiumErrorBtn} 
                 onPress={() => setPremiumError({visible: false, message: ''})}
               >
                  <Text style={styles.premiumErrorBtnText}>Try Again</Text>
               </TouchableOpacity>
            </View>
         </View>
      )}
`;

content = content.replace(
  `    </SafeAreaView>\n  );\n}`,
  modalsHtml + `\n    </SafeAreaView>\n  );\n}`
);

// 6. Add Styles
const stylesObj = `
  // Guidelines Modal
  guidelinesOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  guidelinesCard: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 50, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  guidelinesClose: { position: 'absolute', top: 20, right: 20, padding: 8 },
  guidelinesIconHeader: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  guidelinesTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  guidelinesSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  rulesList: { width: '100%', backgroundColor: '#F9F9F9', borderRadius: 20, padding: 20, marginBottom: 30 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ruleText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500', marginLeft: 12 },
  guidelinesActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  premiumPrimaryBtn: { flex: 1, backgroundColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginRight: 10 },
  premiumSecondaryBtn: { flex: 1, backgroundColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, marginLeft: 10 },
  premiumBtnTextWhite: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  premiumBtnTextDark: { color: '#1A1A1A', fontSize: 16, fontWeight: '700' },

  // Premium Error Overlay
  premiumErrorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  premiumErrorCard: { backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 },
  premiumErrorTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  premiumErrorMsg: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  premiumErrorBtn: { backgroundColor: '#1A1A1A', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  premiumErrorBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});`;

content = content.replace(/}\);\s*$/, stylesObj);

fs.writeFileSync(path, content, 'utf8');
console.log('Update complete!');
