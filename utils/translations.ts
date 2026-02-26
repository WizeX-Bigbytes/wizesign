/**
 * Patient-facing UI translations — English & Malayalam
 * Used for NMC compliance: language accessibility for consent forms.
 */

export type Language = 'en' | 'ml';

export const translations: Record<Language, Record<string, string>> = {
    en: {
        // Header
        actionRequired: 'Action Required',
        reviewAndSign: 'Please review the document below and provide your signature.',
        awaitingSignature: 'Awaiting Signature',

        // OTP
        otpTitle: 'Identity Verification',
        otpSubtitle: 'We need to verify your identity before you can sign this document.',
        sendOtp: 'Send Verification Code',
        enterOtp: 'Enter the code sent to your phone',
        verifyCode: 'Verify Code',
        verificationComplete: 'Identity Verified',

        // Footer checkboxes
        confirmIdentity: 'I confirm I am',
        eSignConsent: 'I consent to use electronic signatures and agree that my electronic signature is legally binding. I have read and agree to the document contents and the Electronic Signature Disclosure & Terms of Service.',
        dataPrivacyConsent: 'I acknowledge that my personal data (name, phone number, email, IP address, and signature) will be collected, stored, and processed in accordance with the Digital Personal Data Protection Act, 2023 for the purpose of maintaining medical records.',
        agreeAndSign: 'I Agree and Sign',

        // Sign modal
        signDocument: 'Sign Document',
        signInBox: 'Please sign in the box below',

        // Language toggle
        language: 'Language',
    },
    ml: {
        // Header
        actionRequired: 'നടപടി ആവശ്യമാണ്',
        reviewAndSign: 'ദയവായി ചുവടെയുള്ള രേഖ പരിശോധിച്ച് നിങ്ങളുടെ ഒപ്പ് നൽകുക.',
        awaitingSignature: 'ഒപ്പ് കാത്തിരിക്കുന്നു',

        // OTP
        otpTitle: 'ഐഡന്റിറ്റി പരിശോധന',
        otpSubtitle: 'ഈ രേഖ ഒപ്പിടുന്നതിന് മുമ്പ് നിങ്ങളുടെ ഐഡന്റിറ്റി പരിശോധിക്കേണ്ടതുണ്ട്.',
        sendOtp: 'പരിശോധനാ കോഡ് അയയ്ക്കുക',
        enterOtp: 'നിങ്ങളുടെ ഫോണിലേക്ക് അയച്ച കോഡ് നൽകുക',
        verifyCode: 'കോഡ് പരിശോധിക്കുക',
        verificationComplete: 'ഐഡന്റിറ്റി പരിശോധിച്ചു',

        // Footer checkboxes
        confirmIdentity: 'ഞാൻ ആണെന്ന് സ്ഥിരീകരിക്കുന്നു',
        eSignConsent: 'ഇലക്‌ട്രോണിക് ഒപ്പ് ഉപയോഗിക്കാൻ ഞാൻ സമ്മതിക്കുന്നു, എന്റെ ഇലക്‌ട്രോണിക് ഒപ്പ് നിയമപരമായി ബാധ്യസ്ഥമാണെന്ന് ഞാൻ അംഗീകരിക്കുന്നു. രേഖയിലെ ഉള്ളടക്കവും ഇലക്‌ട്രോണിക് ഒപ്പ് വെളിപ്പെടുത്തൽ & സേവന നിബന്ധനകളും ഞാൻ വായിക്കുകയും അംഗീകരിക്കുകയും ചെയ്തു.',
        dataPrivacyConsent: 'ഡിജിറ്റൽ പേഴ്‌സണൽ ഡേറ്റ പ്രൊട്ടക്ഷൻ ആക്ട്, 2023 അനുസരിച്ച് മെഡിക്കൽ രേഖകൾ സൂക്ഷിക്കുന്നതിനായി എന്റെ വ്യക്തിഗത ഡാറ്റ (പേര്, ഫോൺ നമ്പർ, ഇമെയിൽ, IP വിലാസം, ഒപ്പ്) ശേഖരിക്കുകയും സംഭരിക്കുകയും പ്രോസസ്സ് ചെയ്യുകയും ചെയ്യുമെന്ന് ഞാൻ അംഗീകരിക്കുന്നു.',
        agreeAndSign: 'ഞാൻ സമ്മതിക്കുന്നു, ഒപ്പിടുന്നു',

        // Sign modal
        signDocument: 'രേഖ ഒപ്പിടുക',
        signInBox: 'ദയവായി ചുവടെയുള്ള ബോക്സിൽ ഒപ്പിടുക',

        // Language toggle
        language: 'ഭാഷ',
    }
};
