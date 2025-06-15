export const getThemeColors = (isDarkMode) => ({
    mode: isDarkMode ? 'dark' : 'light',
    // 🧱 Layout & Backgrounds
    background: isDarkMode ? '#12161C' : '#ffffff', // App root background
    card: isDarkMode ? '#1E222A' : '#f1f1f3', // Cards or blocks background
    surface: isDarkMode ? '#181C22' : '#f9f9f9', // Neutral surfaces (modals, panels)
    highlight: isDarkMode ? '#2A2F38' : '#e2e2e6', // For hoverable elements
    overlay: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.6)', // Transparent modal overlays

    // 📝 Text & Typography
    title: isDarkMode ? '#ffffff' : '#333333', // Main headings
    text: isDarkMode ? '#D1D5DB' : '#5f6368', // Standard body text
    mutedText: isDarkMode ? '#9CA3AF' : '#a0a0a0', // Less prominent text (e.g., timestamps)
    placeholder: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', // Input placeholder color

    // 🧾 Inputs & Borders
    input: isDarkMode ? '#1C1F26' : '#ffffff', // Text input backgrounds
    inputText: isDarkMode ? '#E5E7EB' : '#333', // Input text color
    inputBorder: isDarkMode ? '#3F4753' : '#d9e0e6', // Input border line
    border: isDarkMode ? '#3F4753' : '#d9e0e6', // General border color
    focusOutline: isDarkMode ? '#4B9BE3' : '#0078D4', // Input focus ring color

    // 🔘 Buttons
    buttonPrimaryBackground: '#0078D4', // Primary action button background
    buttonPrimaryText: '#ffffff', // Text on primary buttons
    buttonSecondaryBackground: '#D93F2B', // Secondary/danger button background
    buttonSecondaryText: '#ffffff', // Text on secondary buttons
    buttonDisabledBackground: isDarkMode ? '#2C313A' : '#cccccc', // Disabled button background
    buttonDisabledText: isDarkMode ? '#6B7280' : '#999', // Disabled button text

    // ✅ Status Feedback Colors
    success: '#4CAF50', // Success indicators (checkmarks, alerts)
    successBackground: isDarkMode ? '#234B2D' : '#d4edda', // Success alert background
    error: '#D93F2B', // Error indicators (icons, messages)
    errorBackground: isDarkMode ? '#4B2D2B' : '#f8d7da', // Error alert background
    warning: '#FFB900', // Warning icon or tag
    warningBackground: isDarkMode ? '#4F4220' : '#fff3cd', // Warning alert background
    info: '#0078D4', // Info icon or message
    infoBackground: isDarkMode ? '#243B52' : '#d1ecf1', // Info alert background

    // ⚙️ Actions & Interactions
    actionBackground: isDarkMode ? '#2B313D' : '#f4f6f8', // Background for action rows/buttons
    actionText: isDarkMode ? '#D1D7DD' : '#333333', // Text for actions like links or chips
    disabled: isDarkMode ? '#3B4049' : '#e0e0e0', // Disabled element background

    // 🎨 Icons & Visuals
    icon: isDarkMode ? '#C5CBD3' : '#4a4a4a', // Default icon color

    // 🔗 Links & Interactivity
    link: isDarkMode ? '#4B9BE3' : '#0078D4', // Anchor/link color
    linkHover: isDarkMode ? '#60AFFF' : '#005A8C', // Hover color for links

    // 🏷️ Badges & Tags
    badge: '#0078D4', // Badge background
    badgeText: '#ffffff', // Badge label color
    tagBackground: isDarkMode ? '#2E3442' : '#ebf2fa', // Tag/chip background
    tagText: isDarkMode ? '#E0E4E9' : '#1a1d2c', // Tag/chip label

    // 📏 Dividers & Shadows
    divider: isDarkMode ? '#3F4753' : '#d9e0e6', // Section separators
    shadow: isDarkMode ? '#00000066' : '#0000001a', // General shadows
    cardShadow: isDarkMode ? '#00000066' : '#0000001a', // Card-specific shadow

    // 🪟 Modals & Popups
    modalBackground: isDarkMode ? '#1C1F26' : '#ffffff', // Background for modals/dialogs

    // 🖱️ Hover/Focus Effects
    hoverBackground: isDarkMode ? '#2A2F38' : '#f4f6f8', // Hover state background

    // 🧭 Header & Footer Styling
    headerBackground: isDarkMode ? '#20252E' : '#f1f1f3', // App headers/navbars
    footerBackground: isDarkMode ? '#12161C' : '#ffffff', // App footers
});
