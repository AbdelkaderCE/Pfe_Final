import React, { useState, useRef, useEffect } from 'react';

const SparklesIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const SendIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

const XIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const MinusIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
);

const PlusIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = (p) => (
  <svg {...p} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const API_URL = 'http://localhost:8081/chat';

// ==================== أسئلة لكل دور حسب اللغة ====================

const getRoleSpecificButtons = (role, lang) => {
  // ==================== GUEST (ضيف) ====================
  if (!role) {
    if (lang === 'ar') {
      return [
        { icon: "❓", question: "ما هو هذا الموقع؟", answer: "هذه هي منصة G11، نظام إدارة جامعي متكامل.\n\nالطلاب: متابعة المواد والدرجات والشكاوى ومشاريع PFE\nالأساتذة: إدارة المواد والطلاب والدرجات ومشاريع PFE\nالمديرون: إدارة المستخدمين والإعلانات وحملات التوجيه\n\n🔐 يرجى تسجيل الدخول للوصول إلى بياناتك الشخصية." },
        { icon: "🔑", question: "كيف أسجل دخول؟", answer: "لتسجيل الدخول:\n\n1. اذهب إلى صفحة تسجيل الدخول\n2. أدخل بريدك الإلكتروني وكلمة المرور\n\n📧 حسابات تجريبية:\n- طالب: student@univ-tiaret.dz\n- أستاذ: teacher@univ-tiaret.dz\n- مدير: admin@univ-tiaret.dz\n\nكلمة المرور لجميع الحسابات: Test@123" },
        { icon: "📚", question: "ما هي ميزات المنصة؟", answer: "منصة G11 تقدم:\n\n👨‍🎓 للطلاب:\n- عرض المواد والدرجات\n- تقديم الشكاوى والمبررات\n- اختيار مشاريع PFE\n\n👨‍🏫 للأساتذة:\n- إدارة المواد والطلاب\n- إدخال العلامات\n- اقتراح مشاريع PFE\n\n👑 للمديرين:\n- إدارة المستخدمين\n- إنشاء الإعلانات\n- إدارة حملات التوجيه والمجلس التأديبي" },
        { icon: "💬", question: "هل يمكنني استخدام الشات بدون حساب؟", answer: "نعم، يمكنك استخدام الشات كضيف لطرح الأسئلة العامة عن المنصة.\n\nللوصول إلى بياناتك الشخصية (المواد، الدرجات، الشكاوى، إلخ)، يرجى تسجيل الدخول.\n\n🔑 حسابات تجريبية متاحة للاختبار." },
        { icon: "📞", question: "كيف يمكنني الاتصال بالدعم؟", answer: "للاتصال بالدعم:\n\n📧 البريد الإلكتروني: support@g11.edu.dz\n📞 الهاتف: 0555 55 55 55\n📍 الموقع: جامعة تيارت، الجزائر" },
      ];
    } else if (lang === 'fr') {
      return [
        { icon: "❓", question: "Qu'est-ce que cette plateforme?", answer: "Ceci est la plateforme G11, un système de gestion universitaire intégré.\n\nÉtudiants: Suivre les cours, notes, réclamations, projets PFE\nEnseignants: Gérer les cours, étudiants, notes, projets PFE\nAdmins: Gestion des utilisateurs, annonces, campagnes\n\n🔐 Veuillez vous connecter pour accéder à vos données." },
        { icon: "🔑", question: "Comment se connecter?", answer: "Pour vous connecter:\n\n1. Allez à la page de connexion\n2. Entrez votre email et mot de passe\n\n📧 Comptes démo:\n- Étudiant: student@univ-tiaret.dz\n- Enseignant: teacher@univ-tiaret.dz\n- Admin: admin@univ-tiaret.dz\n\nMot de passe: Test@123" },
        { icon: "📚", question: "Quelles sont les fonctionnalités?", answer: "La plateforme G11 offre:\n\n👨‍🎓 Pour les étudiants:\n- Voir les cours et notes\n- Soumettre réclamations et justifications\n- Choisir des projets PFE\n\n👨‍🏫 Pour les enseignants:\n- Gérer les cours et étudiants\n- Saisir les notes\n- Proposer des projets PFE\n\n👑 Pour les administrateurs:\n- Gérer les utilisateurs\n- Créer des annonces\n- Gérer les campagnes d'orientation" },
        { icon: "💬", question: "Puis-je utiliser le chat sans compte?", answer: "Oui, vous pouvez utiliser le chat en tant qu'invité pour poser des questions générales.\n\nPour accéder à vos données personnelles, veuillez vous connecter.\n\n🔑 Comptes démo disponibles pour les tests." },
        { icon: "📞", question: "Comment contacter le support?", answer: "Pour contacter le support:\n\n📧 Email: support@g11.edu.dz\n📞 Téléphone: 0555 55 55 55\n📍 Université de Tiaret, Algérie" },
      ];
    }
    // English default for Guest
    return [
      { icon: "❓", question: "What is this platform?", answer: "This is G11 University Platform, an integrated university management system.\n\nStudents: Track courses, grades, complaints, PFE projects\nTeachers: Manage courses, students, grades, PFE projects\nAdmins: User management, announcements, campaigns\n\n🔐 Please log in to access your personal data." },
      { icon: "🔑", question: "How to log in?", answer: "To log in:\n\n1. Go to the login page\n2. Enter your email and password\n\n📧 Demo accounts:\n- Student: student@univ-tiaret.dz\n- Teacher: teacher@univ-tiaret.dz\n- Admin: admin@univ-tiaret.dz\n\nPassword for all: Test@123" },
      { icon: "📚", question: "What are the platform features?", answer: "G11 platform offers:\n\n👨‍🎓 For Students:\n- View courses and grades\n- Submit complaints and justifications\n- Choose PFE projects\n\n👨‍🏫 For Teachers:\n- Manage courses and students\n- Enter grades\n- Propose PFE projects\n\n👑 For Admins:\n- User management\n- Create announcements\n- Manage orientation campaigns" },
      { icon: "💬", question: "Can I use the chat without an account?", answer: "Yes, you can use the chat as a guest to ask general questions.\n\nTo access your personal data, please log in.\n\n🔑 Demo accounts available for testing." },
      { icon: "📞", question: "How to contact support?", answer: "To contact support:\n\n📧 Email: support@g11.edu.dz\n📞 Phone: 0555 55 55 55\n📍 University of Tiaret, Algeria" },
    ];
  }

  // ==================== STUDENT (طالب) ====================
  if (role === 'student' || role === 'etudiant') {
    if (lang === 'ar') {
      return [
        { icon: "📝", question: "كيف أقدم شكوى؟", answer: "لتقديم شكوى كطالب:\n\n1. سجل الدخول إلى حسابك\n2. اذهب إلى Dashboard → تبويب Reclamations\n3. اضغط على 'New Reclamation'\n4. اكتب عنوان الشكوى ونوعها وأولويتها\n5. اشرح المشكلة بالتفصيل\n6. يمكنك إرفاق مستندات داعمة (اختياري)\n7. اضغط 'Submit'\n\nسيتم إشعارك عندما يتم الرد على شكواك." },
        { icon: "📄", question: "كيف أقدم مبرر غياب؟", answer: "لتقديم مبرر غياب:\n\n1. سجل الدخول إلى حسابك\n2. اذهب إلى صفحة Requests\n3. اختر تبويب 'Justification'\n4. اضغط 'New Justification'\n5. اكتب الموضوع ونوع التبرير\n6. حدد تاريخ الغياب\n7. اشرح سبب الغياب\n8. ارفع المستندات المطلوبة (شهادة طبية، إلخ)\n9. اضغط 'Submit'" },
        { icon: "🎓", question: "كيف أرى درجاتي؟", answer: "لعرض درجاتك:\n\n1. سجل الدخول إلى حسابك\n2. اذهب إلى Dashboard → 'My Notes' أو 'Profile'\n3. ستظهر:\n   - معدلك العام\n   - درجات كل مادة على حدة\n   - عدد الساعات والمعاملات\n\nملاحظة: الدرجات تظهر بعد إدخال الأساتذة لها." },
        { icon: "🔒", question: "كيف أغير كلمة المرور؟", answer: "لتغيير كلمة المرور:\n\n1. سجل الدخول إلى حسابك\n2. اذهب إلى Dashboard → تبويب Profile\n3. اذهب إلى قسم 'Security'\n4. أدخل:\n   - كلمة المرور الحالية\n   - كلمة المرور الجديدة (8 أحرف على الأقل)\n   - تأكيد كلمة المرور الجديدة\n5. اضغط 'Change Password'\n\n⚠️ بعد التغيير، ستحتاج لتسجيل الدخول مجدداً." },
        { icon: "📋", question: "كيف أختار مشروع PFE؟", answer: "لاختيار مشروع PFE:\n\n1. سجل الدخول إلى حسابك\n2. اذهب إلى صفحة 'My Projects' أو 'PFE Projects'\n3. شاهد قائمة المشاريع المتاحة\n4. اختر المشاريع التي تهمك\n5. رتب رغباتك حسب الأولوية\n6. أرسل اختياراتك\n\nسيتم إشعارك بنتيجة التوجيه لاحقاً." },
        { icon: "🏫", question: "كيف أرى المواد المسجلة؟", answer: "لرؤية المواد المسجلة:\n\n1. سجل الدخول إلى حسابك\n2. اذهب إلى Dashboard\n3. ستظهر قائمة المواد في قسم 'Your Modules'\n4. تتضمن: اسم المادة، الرمز، المعامل، الساعات\n5. يمكنك النقر على أي مادة لرؤية تفاصيل أكثر" },
      ];
    } else if (lang === 'fr') {
      return [
        { icon: "📝", question: "Comment soumettre une réclamation?", answer: "Pour soumettre une réclamation en tant qu'étudiant:\n\n1. Connectez-vous à votre compte\n2. Allez à Dashboard → onglet Reclamations\n3. Cliquez sur 'New Reclamation'\n4. Remplissez: titre, type, priorité\n5. Expliquez le problème en détail\n6. Joignez des documents (optionnel)\n7. Cliquez sur 'Submit'\n\nVous serez notifié quand votre réclamation sera traitée." },
        { icon: "📄", question: "Comment soumettre une justification d'absence?", answer: "Pour soumettre une justification d'absence:\n\n1. Connectez-vous à votre compte\n2. Allez à la page Requests\n3. Choisissez l'onglet 'Justification'\n4. Cliquez 'New Justification'\n5. Remplissez: sujet, type, date d'absence\n6. Expliquez la raison\n7. Joignez les documents (certificat médical, etc.)\n8. Cliquez 'Submit'" },
        { icon: "🎓", question: "Comment voir mes notes?", answer: "Pour voir vos notes:\n\n1. Connectez-vous à votre compte\n2. Allez à Dashboard → 'My Notes' ou 'Profile'\n3. Vous verrez:\n   - Votre moyenne générale\n   - Les notes par module\n   - Les crédits et coefficients" },
        { icon: "🔒", question: "Comment changer mon mot de passe?", answer: "Pour changer votre mot de passe:\n\n1. Connectez-vous à votre compte\n2. Allez à Dashboard → onglet Profile\n3. Allez à la section 'Security'\n4. Entrez:\n   - Mot de passe actuel\n   - Nouveau mot de passe\n   - Confirmation\n5. Cliquez 'Change Password'" },
        { icon: "📋", question: "Comment choisir mon projet PFE?", answer: "Pour choisir votre projet PFE:\n\n1. Connectez-vous à votre compte\n2. Allez à 'My Projects' ou 'PFE Projects'\n3. Parcourez les projets disponibles\n4. Classez vos préférences\n5. Soumettez vos choix\n\nVous serez notifié du résultat." },
        { icon: "🏫", question: "Comment voir mes modules?", answer: "Pour voir vos modules:\n\n1. Connectez-vous à votre compte\n2. Allez à Dashboard\n3. La liste des modules apparaît dans 'Your Modules'\n4. Vous verrez: nom, code, coefficient, crédits" },
      ];
    }
    // English default for Student
    return [
      { icon: "📝", question: "How to submit a complaint?", answer: "To submit a complaint as a student:\n\n1. Log in to your account\n2. Go to Dashboard → Reclamations tab\n3. Click 'New Reclamation'\n4. Fill in: title, type, priority\n5. Describe the issue in detail\n6. Attach supporting documents (optional)\n7. Click 'Submit'\n\nYou'll be notified when your complaint is responded to." },
      { icon: "📄", question: "How to submit an absence justification?", answer: "To submit an absence justification:\n\n1. Log in to your account\n2. Go to Requests page\n3. Select 'Justification' tab\n4. Click 'New Justification'\n5. Fill in: subject, type, absence date\n6. Explain the reason\n7. Upload documents (medical certificate, etc.)\n8. Click 'Submit'" },
      { icon: "🎓", question: "How to view my grades?", answer: "To view your grades:\n\n1. Log in to your account\n2. Go to Dashboard → 'My Notes' or 'Profile'\n3. You'll see:\n   - Your overall average\n   - Grades per module\n   - Credits and coefficients" },
      { icon: "🔒", question: "How to change my password?", answer: "To change your password:\n\n1. Log in to your account\n2. Go to Dashboard → Profile tab\n3. Go to 'Security' section\n4. Enter:\n   - Current password\n   - New password (min 8 characters)\n   - Confirm new password\n5. Click 'Change Password'" },
      { icon: "📋", question: "How to choose a PFE project?", answer: "To choose a PFE project:\n\n1. Log in to your account\n2. Go to 'My Projects' or 'PFE Projects'\n3. Browse available projects\n4. Rank your preferences\n5. Submit your choices\n\nYou'll be notified of the result." },
      { icon: "🏫", question: "How to view my enrolled modules?", answer: "To view your enrolled modules:\n\n1. Log in to your account\n2. Go to Dashboard\n3. Modules appear in 'Your Modules' section\n4. Shows: name, code, coefficient, credits" },
    ];
  }

  // ==================== TEACHER (أستاذ) ====================
  if (role === 'teacher' || role === 'enseignant') {
    if (lang === 'ar') {
      return [
        { icon: "📊", question: "كيف أدخل درجات الطلاب؟", answer: "لإدخال درجات الطلاب:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → تبويب Students\n3. اختر المادة التي تريد\n4. ستظهر قائمة الطلاب المسجلين\n5. لكل طالب، أدخل:\n   - علامة المراقبة المستمرة\n   - علامة الامتحان النهائي\n6. احفظ التغييرات\n\nيمكنك أيضاً استيراد الدرجات من ملف Excel." },
        { icon: "👥", question: "كيف أرى طلابي؟", answer: "لرؤية قائمة طلابك:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → تبويب Students\n3. اختر المادة من القائمة المنسدلة\n4. ستظهر قائمة بجميع الطلاب المسجلين في تلك المادة\n5. تشمل المعلومات:\n   - الاسم الكامل\n   - رقم التسجيل\n   - البريد الإلكتروني\n   - الدرجات (إن وجدت)" },
        { icon: "💬", question: "كيف أرد على شكوى طالب؟", answer: "للرد على شكوى طالب:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → تبويب Reclamations\n3. ابحث عن الشكوى التي تريد الرد عليها\n4. اضغط 'Review'\n5. اختر الحالة:\n   - Approved (مقبولة)\n   - Rejected (مرفوضة)\n   - Pending (قيد الانتظار)\n6. اكتب ردك للطالب\n7. يمكنك إضافة ملاحظة داخلية (للموظفين فقط)\n8. اضغط 'Save'" },
        { icon: "📢", question: "كيف أنشر إعلاناً للطلاب؟", answer: "لنشر إعلان:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → تبويب Announcements\n3. اضغط 'New Announcement'\n4. املأ البيانات:\n   - العنوان\n   - الوصف\n   - اختر المادة\n   - نوع الإعلان\n5. حدد الحالة (منشور/مسودة)\n6. اختر الفئة المستهدفة (طلاب/الكل)\n7. حدد الأولوية\n8. يمكنك إرفاق ملفات\n9. اضغط 'Create' أو 'Save'" },
        { icon: "📎", question: "كيف أرفع مستنداً للطلاب؟", answer: "لرفع مستند:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → تبويب Documents\n3. اضغط 'Upload Document'\n4. املأ البيانات:\n   - عنوان المستند\n   - اختر المادة\n   - (اختياري) ربط بإعلان موجود\n5. اختر الملف من جهازك\n6. اضغط 'Upload'\n\nسيصبح المستند متاحاً للطلاب للتحميل." },
        { icon: "📅", question: "كيف أدير مواعيدي وجدولي؟", answer: "لإدارة جدولك:\n\n1. سجل الدخول كأستاذ\n2. اذهب إلى Dashboard → تبويب Schedule\n3. ستظهر:\n   - مواعيد المحاضرات\n   - مواعيد الأعمال الموجهة\n   - مواعيد الامتحانات\n4. يمكنك تصفية حسب المادة أو الأسبوع\n5. للتبديل بين عرض الأسبوع والشهر" },
      ];
    } else if (lang === 'fr') {
      return [
        { icon: "📊", question: "Comment saisir les notes des étudiants?", answer: "Pour saisir les notes:\n\n1. Connectez-vous en tant qu'enseignant\n2. Allez à Dashboard → onglet Students\n3. Sélectionnez le module\n4. Pour chaque étudiant, entrez:\n   - Note de contrôle continu\n   - Note d'examen final\n5. Sauvegardez" },
        { icon: "👥", question: "Comment voir mes étudiants?", answer: "Pour voir vos étudiants:\n\n1. Connectez-vous en tant qu'enseignant\n2. Allez à Dashboard → onglet Students\n3. Sélectionnez le module\n4. La liste des étudiants apparaît" },
        { icon: "💬", question: "Comment répondre à une réclamation d'étudiant?", answer: "Pour répondre:\n\n1. Allez à Dashboard → onglet Reclamations\n2. Trouvez la réclamation\n3. Cliquez 'Review'\n4. Choisissez le statut\n5. Écrivez votre réponse\n6. Cliquez 'Save'" },
        { icon: "📢", question: "Comment publier une annonce?", answer: "Pour publier une annonce:\n\n1. Allez à Dashboard → onglet Announcements\n2. Cliquez 'New Announcement'\n3. Remplissez les informations\n4. Ajoutez des fichiers (optionnel)\n5. Cliquez 'Create'" },
        { icon: "📎", question: "Comment uploader un document?", answer: "Pour uploader un document:\n\n1. Allez à Dashboard → onglet Documents\n2. Cliquez 'Upload Document'\n3. Remplissez: titre, module\n4. Sélectionnez le fichier\n5. Cliquez 'Upload'" },
        { icon: "📅", question: "Comment gérer mon emploi du temps?", answer: "Pour gérer votre emploi du temps:\n\n1. Allez à Dashboard → onglet Schedule\n2. Vous verrez:\n   - Cours magistraux\n   - Travaux dirigés\n   - Examens\n3. Filtrez par module ou semaine" },
      ];
    }
    // English default for Teacher
    return [
      { icon: "📊", question: "How to enter student grades?", answer: "To enter student grades:\n\n1. Log in as Teacher\n2. Go to Dashboard → Students tab\n3. Select the module\n4. For each student, enter:\n   - Continuous assessment grade\n   - Final exam grade\n5. Save changes" },
      { icon: "👥", question: "How to view my students?", answer: "To view your students:\n\n1. Log in as Teacher\n2. Go to Dashboard → Students tab\n3. Select a module from dropdown\n4. The list of enrolled students will appear" },
      { icon: "💬", question: "How to respond to a student complaint?", answer: "To respond:\n\n1. Go to Dashboard → Reclamations tab\n2. Find the complaint\n3. Click 'Review'\n4. Select status (Approved/Rejected/Pending)\n5. Write your response\n6. Add internal note (optional)\n7. Click 'Save'" },
      { icon: "📢", question: "How to publish an announcement?", answer: "To publish:\n\n1. Go to Dashboard → Announcements tab\n2. Click 'New Announcement'\n3. Fill in: title, description, module\n4. Set status and priority\n5. Attach files (optional)\n6. Click 'Create'" },
      { icon: "📎", question: "How to upload a document?", answer: "To upload:\n\n1. Go to Dashboard → Documents tab\n2. Click 'Upload Document'\n3. Fill in: title, module\n4. Select file\n5. Click 'Upload'" },
      { icon: "📅", question: "How to manage my schedule?", answer: "To manage your schedule:\n\n1. Go to Dashboard → Schedule tab\n2. You'll see:\n   - Lectures\n   - Tutorials\n   - Exams\n3. Filter by module or week" },
    ];
  }

  // ==================== ADMIN (مدير) ====================
  if (role === 'admin') {
    if (lang === 'ar') {
      return [
        { icon: "🗑️", question: "كيف أحذف مستخدم؟", answer: "لحذف مستخدم كمدير:\n\n1. سجل الدخول كمدير\n2. اذهب إلى Admin Panel → Users\n3. ابحث عن المستخدم المطلوب\n4. اضغط على زر 'Delete'\n5. قم بتأكيد الحذف\n\nملاحظة: إذا كان المستخدم مرتبطاً ببيانات أكاديمية، سيتم تعليقه بدلاً من حذفه نهائياً." },
        { icon: "➕", question: "كيف أضيف مستخدم جديد؟", answer: "لإضافة مستخدم جديد:\n\nطريقة 1 - مستخدم واحد:\n1. اذهب إلى Admin Panel → Users\n2. املأ النموذج في الأعلى (الاسم، البريد، الدور)\n3. اضغط 'Create User'\n\nطريقة 2 - عدة مستخدمين:\n1. اذهب إلى Admin Panel → Users\n2. اضغط 'Open list creation page'\n3. املأ الجدول (يمكنك إضافة عدة صفوف)\n4. اضغط 'Create List'\n\nطريقة 3 - استيراد Excel:\n1. جهز ملف Excel بالأعمدة: nom, prenom, email, roles\n2. ارفع الملف واضغط 'Import Excel'\n\nسيتم إنشاء كلمة مرور مؤقتة لكل مستخدم ويمكنك تحميلها كملف PDF." },
        { icon: "📰", question: "كيف أدير الإعلانات؟", answer: "لإدارة الإعلانات:\n\n1. اذهب إلى Admin Panel → Announcements\n2. يمكنك:\n   - إنشاء إعلان جديد (New announcement)\n   - تعديل إعلان موجود (Edit)\n   - حذف إعلان (Delete)\n   - تغيير حالة الإعلان (منشور/مسودة/مؤرشف)\n3. للإعلانات المهمة:\n   - اختر أولوية 'Urgent' أو 'High'\n   - ستظهر في شريط الإعلانات العاجلة في الصفحة الرئيسية" },
        { icon: "📚", question: "كيف أعطي أستاذ مواد معينة؟", answer: "لتعيين أستاذ على مواد:\n\n1. اذهب إلى Admin Panel → Academic Assignments\n2. ابحث عن الأستاذ المطلوب\n3. في قسم 'Teacher Assignments':\n   - اختر المواد التي يدرسها\n   - اختر المجموعة/القسم (اختياري)\n   - أدخل السنة الجامعية (اختياري)\n4. اضغط 'Save Teacher Assignment'\n\nيمكنك أيضاً تعيين طلاب لمجموعات/أقسام في نفس الصفحة." },
        { icon: "🎯", question: "كيف أنشئ حملة توجيه؟", answer: "لإنشاء حملة توجيه (Affectation):\n\n1. أولاً، أنشئ الهيكل الأكاديمي:\n   - اذهب إلى Admin Panel → Academic Management\n   - أنشئ Specialites (تخصصات)\n   - أنشئ Promos (مجموعات/أقسام)\n   - أنشئ Modules (مواد)\n\n2. ثم أنشئ حملة التوجيه:\n   - اذهب إلى صفحة Campaigns\n   - اضغط 'New Campaign'\n   - حدد: الاسم، المستوى المصدر، المستوى الهدف، السنة الجامعية\n   - افتح الحملة للطلاب\n\n3. يمكن للطلاب الآن اختيار رغباتهم\n4. بعد انتهاء المدة، يمكنك معالجة النتائج" },
        { icon: "⚙️", question: "كيف أغير إعدادات الموقع؟", answer: "لتغيير إعدادات الموقع:\n\n1. اذهب إلى Admin Panel → Site Settings\n2. يمكنك تعديل:\n   - شعار الجامعة\n   - صور الخلفية (Hero, Banner)\n   - النصوص: اسم الجامعة، الشعار، الوصف\n   - إحصائيات الصفحة الرئيسية\n   - معلومات الاتصال (البريد، الهاتف، العنوان)\n3. اضغط 'Save Site Settings' لحفظ التغييرات\n\nستظهر التغييرات فوراً في الصفحة الرئيسية." },
      ];
    } else if (lang === 'fr') {
      return [
        { icon: "🗑️", question: "Comment supprimer un utilisateur?", answer: "Pour supprimer un utilisateur:\n\n1. Connectez-vous en tant qu'admin\n2. Allez à Admin Panel → Users\n3. Trouvez l'utilisateur\n4. Cliquez 'Delete'\n5. Confirmez" },
        { icon: "➕", question: "Comment ajouter un nouvel utilisateur?", answer: "Pour ajouter un utilisateur:\n\nMéthode 1 - Un seul:\n1. Admin Panel → Users\n2. Remplissez le formulaire\n3. 'Create User'\n\nMéthode 2 - Plusieurs:\n1. 'Open list creation page'\n2. Remplissez le tableau\n3. 'Create List'\n\nMéthode 3 - Excel:\n1. Préparez un fichier Excel\n2. 'Import Excel'" },
        { icon: "📰", question: "Comment gérer les annonces?", answer: "Pour gérer les annonces:\n\n1. Admin Panel → Announcements\n2. Actions disponibles:\n   - Créer\n   - Modifier\n   - Supprimer\n   - Changer le statut" },
        { icon: "📚", question: "Comment assigner des modules à un enseignant?", answer: "Pour assigner:\n\n1. Admin Panel → Academic Assignments\n2. Trouvez l'enseignant\n3. Cochez les modules\n4. 'Save Teacher Assignment'" },
        { icon: "🎯", question: "Comment créer une campagne d'orientation?", answer: "Pour créer une campagne:\n\n1. Admin Panel → Academic Management\n2. Créez Specialites, Promos, Modules\n3. Allez à Campaigns → 'New Campaign'\n4. Configurez la campagne\n5. Ouvrez-la aux étudiants" },
        { icon: "⚙️", question: "Comment modifier les paramètres du site?", answer: "Pour modifier:\n\n1. Admin Panel → Site Settings\n2. Modifiez:\n   - Logo et images\n   - Textes (nom, sous-titre)\n   - Statistiques\n   - Coordonnées\n3. 'Save Site Settings'" },
      ];
    }
    // English default for Admin
    return [
      { icon: "🗑️", question: "How to delete a user?", answer: "To delete a user as Admin:\n\n1. Log in as Admin\n2. Go to Admin Panel → Users\n3. Find the user\n4. Click 'Delete'\n5. Confirm deletion" },
      { icon: "➕", question: "How to add a new user?", answer: "To add a user:\n\nMethod 1 - Single:\n1. Admin Panel → Users\n2. Fill the form\n3. 'Create User'\n\nMethod 2 - Multiple:\n1. 'Open list creation page'\n2. Fill the table\n3. 'Create List'\n\nMethod 3 - Excel import:\n1. Prepare Excel file\n2. 'Import Excel'" },
      { icon: "📰", question: "How to manage announcements?", answer: "To manage announcements:\n\n1. Admin Panel → Announcements\n2. Actions:\n   - Create new\n   - Edit existing\n   - Delete\n   - Change status (published/draft/archived)" },
      { icon: "📚", question: "How to assign modules to a teacher?", answer: "To assign modules:\n\n1. Admin Panel → Academic Assignments\n2. Find the teacher\n3. Check the modules they teach\n4. Click 'Save Teacher Assignment'" },
      { icon: "🎯", question: "How to create an orientation campaign?", answer: "To create a campaign:\n\n1. Admin Panel → Academic Management\n2. Create Specialites, Promos, Modules\n3. Go to Campaigns → 'New Campaign'\n4. Configure: name, levels, academic year\n5. Open to students for choices" },
      { icon: "⚙️", question: "How to change site settings?", answer: "To change site settings:\n\n1. Admin Panel → Site Settings\n2. Modify:\n   - Logo and images\n   - Texts (name, subtitle)\n   - Statistics\n   - Contact info\n3. Click 'Save Site Settings'" },
    ];
  }

  // Fallback (should not happen)
  return [];
};

// ==================== Helper functions ====================

const getCurrentUserId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user?.userId || user?.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getCurrentUserRole = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const role = user?.role || user?.roleName || null;
      if (role) {
        const lowerRole = role.toLowerCase();
        if (lowerRole === 'admin') return 'admin';
        if (lowerRole === 'teacher' || lowerRole === 'enseignant') return 'teacher';
        if (lowerRole === 'student' || lowerRole === 'etudiant') return 'student';
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getAuthToken = () => {
  return localStorage.getItem('chatbot_token') || localStorage.getItem('token');
};

const detectLanguage = () => {
  const htmlLang = document.documentElement.lang || 'en';
  const userLang = navigator.language || 'en';
  if (htmlLang === 'ar' || userLang.startsWith('ar')) return 'ar';
  if (htmlLang === 'fr' || userLang.startsWith('fr')) return 'fr';
  return 'en';
};

const getStorageKey = () => {
  const userId = getCurrentUserId();
  if (userId) {
    return `g11_chat_sessions_${userId}`;
  }
  return 'g11_chat_sessions_guest';
};

const getWelcomeMessage = (lang, isLoggedIn) => {
  if (isLoggedIn) {
    if (lang === 'ar') return "👋 مرحباً! أنا المساعد الذكي لنظام G11. اسألني أي شيء عن المواد الدراسية والطلاب والمشاريع أو الشكاوى.";
    if (lang === 'fr') return "👋 Bonjour! Je suis l'assistant intelligent du système G11. Posez-moi n'importe quelle question sur les cours, les étudiants, les projets ou les réclamations.";
    return "👋 Hello! I am the G11 system intelligent assistant. Ask me anything about courses, students, projects, or complaints.";
  }
  if (lang === 'ar') return "👋 مرحباً بك في مساعد G11!\n\nأنا هنا لمساعدتك. يرجى تسجيل الدخول للوصول إلى جميع الميزات.\n\n🔑 حسابات تجريبية:\n- طالب: student@univ-tiaret.dz\n- أستاذ: teacher@univ-tiaret.dz\n- مدير: admin@univ-tiaret.dz";
  if (lang === 'fr') return "👋 Bienvenue sur l'assistant G11!\n\nJe suis là pour vous aider. Veuillez vous connecter pour accéder à toutes les fonctionnalités.\n\n🔑 Comptes démo:\n- Étudiant: student@univ-tiaret.dz\n- Enseignant: teacher@univ-tiaret.dz\n- Admin: admin@univ-tiaret.dz";
  return "👋 Welcome to G11 Assistant!\n\nI'm here to help you. Please log in to access all features.\n\n🔑 Demo accounts:\n- Student: student@univ-tiaret.dz\n- Teacher: teacher@univ-tiaret.dz\n- Admin: admin@univ-tiaret.dz";
};

const createWelcomeSession = (lang, isLoggedIn) => {
  return {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: isLoggedIn ? 'New conversation' : (lang === 'ar' ? 'محادثة جديدة' : lang === 'fr' ? 'Nouvelle conversation' : 'New conversation'),
    createdAt: new Date().toISOString(),
    messages: [{
      id: Date.now(),
      sender: 'bot',
      content: getWelcomeMessage(lang, isLoggedIn),
      time: new Date().toLocaleTimeString(),
    }],
  };
};

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });

// ==================== Main Component ====================

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentLang, setCurrentLang] = useState('en');
  const [currentRole, setCurrentRole] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const lang = detectLanguage();
    setCurrentLang(lang);
    const userId = getCurrentUserId();
    const role = getCurrentUserRole();
    setCurrentUserId(userId);
    setCurrentRole(role);
    
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    } else {
      const isLoggedIn = userId !== null;
      const welcomeSession = createWelcomeSession(lang, isLoggedIn);
      setSessions([welcomeSession]);
      setCurrentSessionId(welcomeSession.id);
      localStorage.setItem(key, JSON.stringify([welcomeSession]));
    }
  }, []);

  useEffect(() => {
    const checkUserChange = () => {
      const newUserId = getCurrentUserId();
      const newRole = getCurrentUserRole();
      if (newUserId !== currentUserId) {
        setSessions([]);
        setCurrentSessionId(null);
        setCurrentUserId(newUserId);
        setCurrentRole(newRole);
        
        const key = getStorageKey();
        const saved = localStorage.getItem(key);
        const lang = currentLang;
        const isLoggedIn = newUserId !== null;
        
        if (saved) {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          if (parsed.length > 0) {
            setCurrentSessionId(parsed[0].id);
          }
        } else {
          const welcomeSession = createWelcomeSession(lang, isLoggedIn);
          setSessions([welcomeSession]);
          setCurrentSessionId(welcomeSession.id);
          localStorage.setItem(key, JSON.stringify([welcomeSession]));
        }
      }
    };
    
    window.addEventListener('storage', checkUserChange);
    window.addEventListener('authChange', checkUserChange);
    return () => {
      window.removeEventListener('storage', checkUserChange);
      window.removeEventListener('authChange', checkUserChange);
    };
  }, [currentUserId, currentLang]);

  const saveSessions = (newSessions) => {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const addGuestButtonMessage = (question, answer) => {
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      content: question,
      time: new Date().toLocaleTimeString(),
    };
    
    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      content: answer,
      time: new Date().toLocaleTimeString(),
    };
    
    const updatedMessages = [...currentSession.messages, userMsg, botMsg];
    const updatedSessions = sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages, title: s.title === (currentLang === 'ar' ? 'محادثة جديدة' : currentLang === 'fr' ? 'Nouvelle conversation' : 'New conversation') ? question.substring(0, 25) : s.title }
        : s
    );
    
    saveSessions(updatedSessions);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString(),
    };
    
    const updatedMessages = [...currentSession.messages, userMsg];
    let updatedSessions = sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages }
        : s
    );
    
    if (currentSession.messages.filter(m => m.sender === 'user').length === 0) {
      const newTitle = trimmed.length > 25 ? trimmed.substring(0, 22) + '...' : trimmed;
      updatedSessions = updatedSessions.map(s =>
        s.id === currentSessionId ? { ...s, title: newTitle } : s
      );
    }
    
    saveSessions(updatedSessions);
    setInput('');
    setIsTyping(true);

    const userId = getCurrentUserId();
    const userRole = getCurrentUserRole();
    const token = getAuthToken();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          sessionId: currentSession.id,
          userId: userId,
          role: userRole
        }),
      });
      
      let reply;
      if (response.ok) {
        const data = await response.json();
        reply = data.reply || data.message || 'Thank you for your message.';
      } else {
        reply = currentLang === 'ar' ? "⚠️ لا يمكن الاتصال بخادم الشات. يرجى المحاولة لاحقاً." 
              : (currentLang === 'fr' ? "⚠️ Impossible de se connecter au serveur de chat. Veuillez réessayer plus tard." 
              : "⚠️ Cannot connect to chatbot server. Please try again later.");
      }
      
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        content: reply,
        time: new Date().toLocaleTimeString(),
      };
      
      const finalMessages = [...updatedMessages, botMsg];
      const finalSessions = updatedSessions.map(s => 
        s.id === currentSessionId ? { ...s, messages: finalMessages } : s
      );
      saveSessions(finalSessions);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = currentLang === 'ar' ? "⚠️ حدث خطأ. يرجى المحاولة مرة أخرى." 
                     : (currentLang === 'fr' ? "⚠️ Une erreur est survenue. Veuillez réessayer." 
                     : "⚠️ An error occurred. Please try again.");
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        content: errorMsg,
        time: new Date().toLocaleTimeString(),
      };
      const finalMessages = [...updatedMessages, botMsg];
      const finalSessions = updatedSessions.map(s => 
        s.id === currentSessionId ? { ...s, messages: finalMessages } : s
      );
      saveSessions(finalSessions);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentSession = getCurrentSession();
  const currentMessages = currentSession?.messages || [];
  const isLoggedIn = currentUserId !== null;
  const userRoleForButtons = getCurrentUserRole();
  const roleButtons = getRoleSpecificButtons(userRoleForButtons, currentLang);
  
  // Determine if we should show buttons (only on first bot message)
  const shouldShowButtons = currentMessages[currentMessages.length - 1]?.sender === 'bot';

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand text-white rounded-full shadow-card flex items-center justify-center hover:bg-brand-hover focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 transition-all duration-200 group"
        aria-label="Open AI Assistant"
      >
        <SparklesIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-150" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] flex flex-col bg-surface border border-edge rounded-xl shadow-card overflow-hidden transition-all duration-200 ${
        isMinimized ? 'h-14' : 'h-[560px] max-h-[calc(100vh-6rem)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand text-white shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors duration-150"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <SparklesIcon className="w-5 h-5" />
          <div>
            <h3 className="text-sm font-semibold leading-none">AI Assistant</h3>
            {!isMinimized && (
              <p className="text-xs text-white/70 mt-0.5">
                {!isLoggedIn ? (currentLang === 'ar' ? 'وضع الضيف' : currentLang === 'fr' ? 'Mode invité' : 'Guest mode') 
                           : (currentLang === 'ar' ? 'متصل' : currentLang === 'fr' ? 'Connecté' : 'Connected')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized((v) => !v)} className="p-1 rounded-md hover:bg-white/20">
            <MinusIcon className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsOpen(false); setIsMinimized(false); setShowSidebar(false); }} className="p-1 rounded-md hover:bg-white/20">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-40 bg-surface-200 dark:bg-canvas border-r border-edge overflow-y-auto shrink-0">
              <div className="p-2 border-b border-edge">
                <button onClick={() => {
                  const isLoggedInNow = getCurrentUserId() !== null;
                  const newSession = createWelcomeSession(currentLang, isLoggedInNow);
                  saveSessions([newSession, ...sessions]);
                  setCurrentSessionId(newSession.id);
                  setShowSidebar(false);
                }} className="w-full py-2 px-3 bg-brand text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-hover">
                  <PlusIcon className="w-4 h-4" />
                  {currentLang === 'ar' ? 'محادثة جديدة' : currentLang === 'fr' ? 'Nouvelle conversation' : 'New conversation'}
                </button>
              </div>
              <div className="p-2 space-y-1">
                {[...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((session) => (
                  <div key={session.id} onClick={() => { setCurrentSessionId(session.id); setShowSidebar(false); }} className={`group relative p-2 rounded-lg cursor-pointer transition-colors ${session.id === currentSessionId ? 'bg-brand/10 border border-brand/30' : 'hover:bg-edge/50'}`}>
                    <div className="text-xs font-medium text-ink truncate pr-5">{session.title}</div>
                    <div className="text-[10px] text-ink-tertiary mt-0.5">{formatDate(new Date(session.createdAt))}</div>
                    <button onClick={(e) => { e.stopPropagation(); if (sessions.length === 1) { alert(currentLang === 'ar' ? 'لا يمكن حذف آخر محادثة' : currentLang === 'fr' ? 'Impossible de supprimer la dernière conversation' : 'Cannot delete the last conversation'); return; } if (window.confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه المحادثة؟' : currentLang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette conversation?' : 'Are you sure you want to delete this conversation?')) { const newSessions = sessions.filter(s => s.id !== session.id); saveSessions(newSessions); if (currentSessionId === session.id) setCurrentSessionId(newSessions[0].id); } }} className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-ink-tertiary hover:text-danger">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-200 dark:bg-canvas">
              {currentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-brand text-white' : 'bg-surface border border-edge text-ink'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/60' : 'text-ink-muted'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}

              {/* Role-specific buttons (only on first bot message) */}
              {shouldShowButtons && roleButtons.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      {currentLang === 'ar' ? 'أسئلة سريعة' : currentLang === 'fr' ? 'Questions rapides' : 'Quick Questions'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {roleButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => addGuestButtonMessage(btn.question, btn.answer)}
                        className="text-left p-3 rounded-lg bg-surface-200 dark:bg-surface-300/30 border border-edge hover:border-brand/50 hover:bg-brand-light/20 transition-all duration-150 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{btn.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink group-hover:text-brand transition-colors">{btn.question}</p>
                            <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{btn.answer.substring(0, 70)}...</p>
                          </div>
                          <svg className="w-4 h-4 text-ink-muted group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-edge rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-edge bg-surface p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentLang === 'ar' ? 'اكتب رسالة...' : currentLang === 'fr' ? 'Tapez un message...' : 'Type a message...'}
                  rows={1}
                  className="flex-1 bg-control-bg border border-control-border rounded-md py-2 px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all duration-150 resize-none max-h-24 overflow-y-auto"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="shrink-0 w-10 h-10 bg-brand text-white rounded-md flex items-center justify-center hover:bg-brand-hover transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-2 text-center">
                {currentLang === 'ar' ? 'إجابات AI للإرشاد فقط - تحقق من المعلومات المهمة' 
                 : currentLang === 'fr' ? 'Les réponses de l\'IA sont fournies à titre indicatif uniquement - vérifiez les informations importantes' 
                 : 'AI responses are for guidance only — verify important information.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}