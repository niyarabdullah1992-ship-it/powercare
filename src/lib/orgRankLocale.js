const ui = {
  en: { title: "Tree grades and icons", hint: "Order controls automatic grades by depth", add: "Grade", positionGrade: "Position grade", automatic: "Automatic by tree level", station: "Station", legend: "Position grade legend", grade: "Grade" },
  ar: { title: "درجات ورموز الشجرة", hint: "الترتيب يحدد الدرجة التلقائية حسب العمق", add: "درجة", positionGrade: "درجة المنصب", automatic: "تلقائي حسب مستوى الشجرة", station: "محطة", legend: "مفتاح درجات المناصب", grade: "درجة" },
  de: { title: "Hierarchiestufen und Symbole", hint: "Die Reihenfolge bestimmt die automatische Stufe", add: "Stufe", positionGrade: "Positionsstufe", automatic: "Automatisch nach Hierarchieebene", station: "Station", legend: "Legende der Positionsstufen", grade: "Stufe" },
  fr: { title: "Niveaux et icônes", hint: "L’ordre détermine le niveau automatique", add: "Niveau", positionGrade: "Niveau du poste", automatic: "Automatique selon la hiérarchie", station: "Station", legend: "Légende des niveaux", grade: "Niveau" },
  es: { title: "Niveles e iconos", hint: "El orden define el nivel automático", add: "Nivel", positionGrade: "Nivel del puesto", automatic: "Automático según la jerarquía", station: "Estación", legend: "Leyenda de niveles", grade: "Nivel" },
  pt: { title: "Níveis e ícones", hint: "A ordem define o nível automático", add: "Nível", positionGrade: "Nível do cargo", automatic: "Automático pela hierarquia", station: "Estação", legend: "Legenda dos níveis", grade: "Nível" },
  ru: { title: "Уровни и значки", hint: "Порядок задаёт автоматический уровень", add: "Уровень", positionGrade: "Уровень должности", automatic: "Автоматически по иерархии", station: "Станция", legend: "Обозначения уровней", grade: "Уровень" },
  ja: { title: "階層とアイコン", hint: "順序で自動階層が決まります", add: "階層", positionGrade: "役職階層", automatic: "ツリー階層で自動設定", station: "ステーション", legend: "役職階層の凡例", grade: "階層" },
  ko: { title: "등급 및 아이콘", hint: "순서에 따라 자동 등급이 정해집니다", add: "등급", positionGrade: "직책 등급", automatic: "조직도 깊이에 따라 자동", station: "현장", legend: "직책 등급 범례", grade: "등급" },
};

const options = {
  en: { crown: "Crown", star: "Star", shield: "Shield", award: "Award", users: "Team", briefcase: "Briefcase", gem: "Gem", navy: "Navy", gold: "Gold", ivory: "Ivory", teal: "Teal", blue: "Blue", sand: "Sand" },
  ar: { crown: "تاج", star: "نجمة", shield: "درع", award: "وسام", users: "فريق", briefcase: "حقيبة عمل", gem: "جوهرة", navy: "كحلي", gold: "ذهبي", ivory: "عاجي", teal: "فيروزي", blue: "أزرق", sand: "رملي" },
  de: { crown: "Krone", star: "Stern", shield: "Schild", award: "Auszeichnung", users: "Team", briefcase: "Aktentasche", gem: "Edelstein", navy: "Marineblau", gold: "Gold", ivory: "Elfenbein", teal: "Petrol", blue: "Blau", sand: "Sand" },
  fr: { crown: "Couronne", star: "Étoile", shield: "Bouclier", award: "Médaille", users: "Équipe", briefcase: "Mallette", gem: "Gemme", navy: "Bleu marine", gold: "Or", ivory: "Ivoire", teal: "Sarcelle", blue: "Bleu", sand: "Sable" },
  es: { crown: "Corona", star: "Estrella", shield: "Escudo", award: "Medalla", users: "Equipo", briefcase: "Maletín", gem: "Gema", navy: "Azul marino", gold: "Dorado", ivory: "Marfil", teal: "Turquesa", blue: "Azul", sand: "Arena" },
  pt: { crown: "Coroa", star: "Estrela", shield: "Escudo", award: "Medalha", users: "Equipe", briefcase: "Pasta", gem: "Gema", navy: "Azul-marinho", gold: "Dourado", ivory: "Marfim", teal: "Turquesa", blue: "Azul", sand: "Areia" },
  ru: { crown: "Корона", star: "Звезда", shield: "Щит", award: "Награда", users: "Команда", briefcase: "Портфель", gem: "Кристалл", navy: "Тёмно-синий", gold: "Золотой", ivory: "Слоновая кость", teal: "Бирюзовый", blue: "Синий", sand: "Песочный" },
  ja: { crown: "王冠", star: "星", shield: "盾", award: "勲章", users: "チーム", briefcase: "鞄", gem: "宝石", navy: "ネイビー", gold: "ゴールド", ivory: "アイボリー", teal: "ティール", blue: "ブルー", sand: "サンド" },
  ko: { crown: "왕관", star: "별", shield: "방패", award: "메달", users: "팀", briefcase: "서류가방", gem: "보석", navy: "네이비", gold: "골드", ivory: "아이보리", teal: "청록", blue: "블루", sand: "샌드" },
};

export const orgRankText = (lang, key) => (ui[lang] || ui.en)[key] || ui.en[key];
export const orgRankOption = (lang, key) => (options[lang] || options.en)[key] || options.en[key] || key;
export const newOrgRankLabels = (number) => Object.fromEntries(Object.keys(ui).map((lang) => [lang, `${orgRankText(lang, "grade")} ${number}`]));