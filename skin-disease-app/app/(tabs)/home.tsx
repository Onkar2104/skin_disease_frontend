import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  FlatList,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

// --- 🌿 ATTRACTIVE GREEN COLOR PALETTE ---
const COLORS = {
  primary: '#065F46',       // Deep Forest Green (Professional, Trust)
  primaryLight: '#D1FAE5',  // Mint Green (Background accents)
  accent: '#F59E0B',        // Warm Amber/Gold (Highlights, Buttons)
  textDark: '#064E3B',      // Dark Green Text
  textGray: '#374151',      // Cool Gray Text
  white: '#FFFFFF',
  bg: '#F0FDF4',            // Very light green tint background
  tipBg: '#ECFDF5',         // Light mint for tip box
  tipBorder: '#10B981',     // Bright green border
};

// --- DATA: REVIEWS ---
const REVIEWS = [
  { id: '1', user: 'Sarah J.', text: 'Fast and easy! Gave me peace of mind about a mole.' },
  { id: '2', user: 'Mike T.', text: 'Incredible accuracy. Matched my doctors diagnosis.' },
  { id: '3', user: 'Emily R.', text: 'Great for a quick check before booking appointments.' },
  { id: '4', user: 'David L.', text: 'Simple interface. Scanned in seconds.' },
  { id: '5', user: 'Chris P.', text: 'The AI analysis is surprisingly detailed.' },
];

export default function DermaCareHome() {
  const scrollRef = useRef(null);
  const [scrollIndex, setScrollIndex] = useState(0);
  const navigateTo = (screen) => console.log(`Navigating to ${screen}`);

  // --- ⚡ AUTO-SCROLL REVIEWS (EVERY 1 SECOND) ---
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollIndex((prevIndex) => {
        let nextIndex = prevIndex + 1;
        if (nextIndex >= REVIEWS.length) {
          nextIndex = 0;
          // Snap back to start quickly without animation loop visual glitch
          scrollRef.current?.scrollToIndex({ index: 0, animated: false });
        } else {
          // Smooth scroll to next
          scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        }
        return nextIndex;
      });
    }, 1000); // 1000ms = 1 second interval

    return () => clearInterval(interval);
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <Text style={{fontSize: 24, marginRight: 5}}>🌿</Text>
            <Text style={styles.logoText}>DermaCare <Text style={{color: COLORS.accent}}>AI</Text></Text>
        </View>
        <View style={styles.authContainer}>
          <TouchableOpacity onPress={() => navigateTo('Login')}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('Register')} style={styles.registerBtn}>
            <Text style={styles.registerBtnText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* --- HERO SECTION (Using image_0.png) --- */}
        <ImageBackground 
          source={require('./assets/image_0.png')} 
          style={styles.heroBackground}
          resizeMode="cover"
        >
           {/* Dark Green Overlay for text readability */}
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
                {/* Infosys Badge */}
                <View style={styles.badge}>
                <Text style={styles.badgeText}>🚀 INFOSYS SPRINGBOARD PROJECT</Text>
                </View>

                <Text style={styles.heroTitle}>Check Your Skin Health</Text>
                <Text style={styles.heroSubtitle}>
                AI-powered analysis for early detection. Fast, private, and precise dermatological insights.
                </Text>

                <TouchableOpacity style={styles.mainCtaBtn} activeOpacity={0.8} onPress={() => navigateTo('Scan')}>
                <Text style={styles.mainCtaText}>GET INSTANT RESULT</Text>
                </TouchableOpacity>

                {/* --- TIP SECTION --- */}
                <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>💡 Tip for Accuracy:</Text>
                <Text style={styles.tipText}>
                    For best results, upload a clear, focused photo of the skin area taken under good natural lighting. This helps the AI analyze texture and color precisely.
                </Text>
                </View>
            </View>
          </View>
        </ImageBackground>

        {/* --- WHY USE DERMACARE AI? --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Why choose DermaCare AI?</Text>
          <Text style={styles.sectionText}>
            Traditional dermatology appointments can take weeks. DermaCare AI bridges the gap with instant preliminary assessments, empowering you to monitor your skin health proactively from home.
          </Text>
        </View>

        {/* --- "SAVE YOUR LIFE" SECTION (Using image_1.png - Body Map) --- */}
        <View style={styles.whiteSection}>
          <Text style={[styles.sectionHeader, {textAlign: 'left', color: COLORS.primary}]}>
            Early detection can save your life
          </Text>
          
          <View style={styles.contentRow}>
             {/* Using image_1.png (Man Body Map) */}
            <Image 
              source={require('./assets/image_1.png')} 
              style={styles.bodyMapImage}
              resizeMode="contain"
            />
            
            <View style={styles.statsContainer}>
              <Text style={styles.statTitle}>Key Facts about Skin Cancer:</Text>
              <View style={styles.statItem}><Text style={styles.bullet}>•</Text><Text style={styles.statPoint}>It is the most common cancer worldwide.</Text></View>
              <View style={styles.statItem}><Text style={styles.bullet}>•</Text><Text style={styles.statPoint}>More than 2 people die of skin cancer every hour.</Text></View>
              <View style={styles.statItem}><Text style={styles.bullet}>•</Text><Text style={styles.statPoint}>Melanoma spreads faster than other skin cancers.</Text></View>
              <View style={styles.statItem}><Text style={styles.bullet}>•</Text><Text style={styles.statPoint}>1 in 50 people will develop it in their lifetime.</Text></View>
              <View style={[styles.statItem, {marginTop: 10}]}>
                <Text style={styles.bulletAccent}>✓</Text>
                <Text style={styles.statPointBold}>When detected early, the 5-year survival rate for melanoma is 99%.</Text>
            </View>
            </View>
          </View>
        </View>

        {/* --- SECOND BANNER (Using image_2.png - Back with moles) --- */}
        <ImageBackground
          source={require('./assets/image_2.png')}
          style={styles.bannerSection}
          resizeMode="cover"
          imageStyle={{top: -50}} // Adjust image position if needed
        >
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Monitor Changes Over Time</Text>
            <Text style={styles.bannerText}>
              Our technology helps you track moles and spots for changes in size, shape, or color.
            </Text>
          </View>
        </ImageBackground>

        {/* --- FAST AUTO-SCROLL REVIEWS --- */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionHeader}>Live User Feedback</Text>
          
          <FlatList
            ref={scrollRef}
            data={REVIEWS}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false} // Disable manual scrolling to let auto-scroll work smoothly
            keyExtractor={(item) => item.id}
            getItemLayout={(data, index) => (
                {length: width - 40, offset: (width - 40) * index, index}
              )}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewStars}>★★★★★</Text>
                <Text style={styles.reviewText}>"{item.text}"</Text>
                 <Text style={styles.userName}>— {item.user}</Text>
              </View>
            )}
          />
        </View>

        {/* --- FINAL CTA --- */}
        <View style={[styles.sectionContainer, {backgroundColor: COLORS.primaryLight}]}>
          <Text style={styles.sectionHeader}>Is it worth it?</Text>
          <Text style={styles.sectionText}>
            Yes. Trained on 100,000+ clinical images and verified by dermatologists, it offers 24/7 peace of mind. Don't let uncertainty wait.
          </Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigateTo('Register')}>
            <Text style={styles.secondaryBtnText}>Start Free Check</Text>
          </TouchableOpacity>
        </View>

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <Text style={{fontSize: 24, marginBottom: 10}}>🌿</Text>
          <Text style={styles.footerLogo}>DermaCare AI</Text>
          <Text style={styles.footerInfosys}>Infosys Springboard Internship Project | Batch 2026</Text>
          <Text style={styles.copyright}>© 2026 All Rights Reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  authContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    marginRight: 20,
    fontSize: 15,
  },
  registerBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  registerBtnText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: 14,
  },

  // HERO SECTION
  heroBackground: {
    width: '100%',
    height: 550, // Fixed height for hero
  },
  heroOverlay: {
      flex: 1,
      backgroundColor: 'rgba(6, 95, 70, 0.85)', // Strong green overlay
      justifyContent: 'center',
      alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    paddingTop: 20,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.primaryLight,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 320,
    lineHeight: 24,
  },
  mainCtaBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 50,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.4,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 30,
  },
  mainCtaText: {
    color: '#3D2800', // Dark brownish text for contrast on gold
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // TIP BOX
  tipBox: {
    backgroundColor: COLORS.tipBg,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.tipBorder,
    width: '90%',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  tipTitle: {
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
    fontSize: 15,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 19,
  },

  // GENERIC SECTIONS
  sectionContainer: {
    padding: 30,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  whiteSection: {
    padding: 30,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20, // Overlap effect
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionText: {
    fontSize: 15,
    color: COLORS.textGray,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: '90%',
  },

  // BODY MAP SECTION
  contentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyMapImage: {
    width: 140, 
    height: 320, 
    marginRight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flex: 1,
    minWidth: 220,
  },
  statTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.textDark,
      marginBottom: 12,
  },
  statItem: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
  },
  bullet: {
      color: COLORS.primary,
      fontSize: 18,
      marginRight: 8,
      lineHeight: 20,
  },
  bulletAccent: {
      color: COLORS.accent,
      fontSize: 20,
      marginRight: 8,
      fontWeight: 'bold',
      lineHeight: 22,
  },
  statPoint: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 20,
  },
  statPointBold: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '700',
    lineHeight: 20,
  },

  // BANNER 2
  bannerSection: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(6, 78, 59, 0.7)', // Darker green overlay
    padding: 20,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10,
  },
  bannerText: {
    color: COLORS.primaryLight,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },

  // REVIEWS (FAST SCROLL)
  reviewsSection: {
    paddingVertical: 40,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    width: width - 40, // Almost full width
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  reviewStars: {
      color: COLORS.accent,
      fontSize: 20,
      marginBottom: 10,
  },
  reviewText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  userName: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 14,
  },

  // SECONDARY BUTTON
  secondaryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },

  // FOOTER
  footer: {
    backgroundColor: '#042F2E', // Very dark green
    padding: 40,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  footerInfosys: {
    fontSize: 12,
    color: COLORS.primaryLight,
    opacity: 0.8,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 12,
    color: COLORS.primaryLight,
    opacity: 0.6,
  },
});