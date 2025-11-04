export type Language = 
  | 'en-US' | 'en-GB' | 'en-CA' | 'en-AU' | 'en-IN'
  | 'zh-CN' | 'zh-TW' | 'zh-HK'
  | 'ja-JP'
  | 'ko-KR'
  | 'de-DE' | 'de-AT' | 'de-CH'
  | 'fr-FR' | 'fr-CA' | 'fr-BE'
  | 'es-ES' | 'es-MX' | 'es-AR'
  | 'it-IT'
  | 'pt-BR' | 'pt-PT'
  | 'ru-RU'
  | 'ar-SA' | 'ar-AE'
  | 'th-TH'
  | 'vi-VN'
  | 'nl-NL'
  | 'pl-PL'
  | 'tr-TR'
  | 'id-ID'
  | 'ms-MY'

export interface Slide {
  title: string
  subtitle: string
  overlayClass: string
}

export interface AppTranslations {
  headerTitle: string
  navGuide: string
  navTips: string
  slides: Slide[]
  body1: string
  body2: string
  cta: string
  toggleZh: string
  toggleEn: string
  privacy: string
  terms: string
  copyright: string
  formTitle: string
  formNameLabel: string
  formPhoneLabel: string
  formCardLabel: string
  formScamExperienceLabel: string
  formSubmit: string
  formErrorMessage: string
}

export interface FormSubmissionTranslations {
  headerTitle: string
  toggleZh: string
  toggleEn: string
  privacy: string
  terms: string
  copyright: string
  formSubmissionTitle: string
  stepBasicInfo: string
  stepScamDetails: string
  stepTransferRecords: string
  stepEvidence: string
  stepBack: string
  stepNext: string
  stepSubmit: string
  // Step 1
  victimInfo: string
  victimName: string
  gender: string
  birthDate: string
  idNumber: string
  address: string
  contactPhone: string
  opponentInfo: string
  opponentIdentity: string
  opponentName: string
  contactMethod: string
  bankAccount: string
  opponentAddress: string
  genderMale: string
  genderFemale: string
  identityIndividual: string
  identityCompany: string
  identityOrganization: string
  identityUnknown: string
    // Step 2
    scamProcessAndDetails: string
    scamMethod: string
    timeline: string
    contactTime: string
    scamProcess: string
    lastContactTime: string
    scamTactics: string
    scamReason: string
    userOperation: string
  // Step 3
  transferRecords: string
  addTransfer: string
  sequenceNumber: string
  transferDate: string
  transferAmount: string
  paymentMethod: string
  payeeInfo: string
  totalLoss: string
  operation: string
  // Step 4
  evidenceTypes: string
  paymentVoucher: string
  communicationRecords: string
  websiteAppScreenshots: string
  policeReportReceipt: string
  otherEvidence: string
  consultedOtherLawFirms: string
  pleaseSpecify: string
  // Placeholders
  opponentNamePlaceholder: string
  contactMethodPlaceholder: string
  bankAccountPlaceholder: string
  opponentAddressPlaceholder: string
  contactTimePlaceholder: string
  scamProcessPlaceholder: string
  lastContactTimePlaceholder: string
  userOperationPlaceholder: string
  transferAmountPlaceholder: string
  paymentMethodPlaceholder: string
  payeeInfoPlaceholder: string
  paymentVoucherPlaceholder: string
  communicationRecordsPlaceholder: string
  websiteAppScreenshotsPlaceholder: string
  policeReportReceiptPlaceholder: string
  otherEvidencePlaceholder: string
}

export interface PowerOfAttorneyTranslations {
  headerTitle: string
  toggleZh: string
  toggleEn: string
  privacy: string
  terms: string
  copyright: string
  documentTitle: string
  principalInfo: string
  principalFullName: string
  principalNationality: string
  principalPassportNumber: string
  principalNationalId: string
  principalAddress: string
  principalPhone: string
  principalEmail: string
  attorneyInfo: string
  attorneyFullName: string
  attorneyLawFirm: string
  attorneyBarLicense: string
  attorneyAddress: string
  attorneyPhone: string
  attorneyEmail: string
  powersGranted: string
  powerDraftDocuments: string
  powerSubmitApplications: string
  powerNegotiations: string
  powerClaimActions: string
  powerReceiveFunds: string
  powerOther: string
  termOfAuthority: string
  termFrom: string
  termTo: string
  termDescription: string
  principalDeclaration: string
  declaration1: string
  declaration2: string
  declaration3: string
  declaration3Part1: string
  declaration3Part2: string
  declaration3Part3: string
  declaration3Part4: string
  signatures: string
  principalSignature: string
  principalDate: string
  attorneySignature: string
  attorneyDate: string
  importantNotes: string
  print: string
  download: string
  submit: string
}

export interface WhatsAppTranslations {
  title: string
  countryRegion: string
  telephoneNumber: string
  authNotice: string
  subtitle: string
  searchPlaceholder: string
  selectCountry: string
  nextButton: string
  sendingButton: string
  qrTitle: string
  qrStep1: string
  qrStep2: string
  qrStep3: string
  qrStep4: string
  qrToggleLink: string
  qrLink: string
  codeTitle: string
  codeSubtitle: string
  codeEdit: string
  codeInstruction1: string
  codeInstruction2Android: string
  codeInstruction2iPhone: string
  codeInstruction3: string
  codeInstruction4: string
  codeQrLink: string
  instructionTitle: string
  androidTutorial: string
  iphoneTutorial: string
  instructionStep: string
  dialogTitle: string
  dialogMessage: string
  dialogGoToHome: string
  dialogButton: string
  errorQr: string
  regenerateButton: string
  generatingQrCode: string
  phoneRequiredMessage: string
  phoneInvalidMessage: string
  pairingCodeSuccessMessage: string
  pairingCodeErrorMessage: string
  rateLimitMessage: string
  copyCode: string
  copied: string
}

export interface HomeTranslations {
  searchLanguage: string
  loggedIn: string
  login: string
  myCurrentAssets: string
  donateToPool: string
  withdraw: string
  performance: string
  links: string
  investmentPlanTitle: string
  investmentPlanDescription: string
  investmentList: string
  redemptionList: string
  serialNumber: string
  date: string
  principal: string
  profit: string
  redemptionProgress: string
  noDataAvailable: string
  addAssets: string
  enterAmountToAdd: string
  max: string
  selectDays: string
  day1: string
  day15: string
  day30: string
  cancel: string
  confirm: string
  withdrawalAmount: string
  enterWithdrawalAmount: string
  withdrawalAccount: string
  loginSuccess: string
  loginNoticeTitle: string
  loginNoticeMessage: string
  loginNoticeButton: string
  validationAmountRequired: string
  validationDaysRequired: string
  validationAmountInvalid: string
  validationWithdrawAmountRequired: string
  validationWithdrawAddressRequired: string
  validationWithdrawAmountInvalid: string
  validationWithdrawAddressInvalid: string
  validationWithdrawDaysRequired: string
  processing: string
}

export interface Translations {
  whatsapp: WhatsAppTranslations
  home: HomeTranslations
}

