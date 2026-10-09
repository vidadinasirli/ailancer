export const PORTFOLIO_CATEGORY_GROUPS = {
  it: {
    id: 'it',
    label: 'İnformasiya texnologiyaları',
    items: ['Veb-Saytların hazırlanması', 'Back-end', 'Front-end', 'iOS', 'Android', 'Desktop soft', 'Bot və məlumat parsinqi', 'Oyun yaradılması', '1C proqramlaşdırma', 'Skriptlər və plaginlər', 'Kompüter şəbəkələri', 'Serverlər', 'Verilənlər bazası', 'Müxtəlif'],
  },
  design: {
    id: 'design',
    label: 'Dizayn',
    items: ['Logotipin hazırlanması', 'Şəkil və illüstrasiyalar', 'Poliqrafiya', 'Banner', 'Vektor qrafika', 'Brandbook', 'Təqdimatlar', 'Animasiya', 'İnteryer Dizayn', 'Eksteryer Dizayn', 'Landşaft Dizayn', 'Müxtəlif'],
  },
  media: {
    id: 'media',
    label: 'Media',
    items: ['Kopiraytinq', 'Video montajı', 'Audio', 'Məqalələr və xəbərlər', 'Adlandırma və şüarlar', 'Tərcümə', 'Məqalələr, diplomlar, sərbəst işlər', 'Məzmunun idarəedilməsi', 'SMM', 'SEO', 'Müxtəlif'],
  },
};

export const PORTFOLIO_CATEGORY_OPTIONS = [
  ...new Set([
    ...Object.values(PORTFOLIO_CATEGORY_GROUPS).map((group) => group.label),
    ...Object.values(PORTFOLIO_CATEGORY_GROUPS).flatMap((group) => group.items),
  ]),
];

export const TASK_CATEGORY_OPTIONS = [
  'Veb-Saytların hazırlanması',
  'Front-end',
  'Back-end',
  'iOS',
  'Android',
  'Dizayn',
  'Logotipin hazırlanması',
  'SMM',
  'Video montaj',
  'Kopiraytinq',
  'Tərcümə',
];

export const ALL_CATEGORY_OPTIONS = [
  ...new Set([...PORTFOLIO_CATEGORY_OPTIONS, ...TASK_CATEGORY_OPTIONS]),
];
