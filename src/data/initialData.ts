import { OptionGroup, Product } from '../types/cafe';

export const DEFAULT_OPTION_TEMPLATES: OptionGroup[] = [
  {
    id: 'grp-leches',
    name: 'Tipo de Leche',
    required: true,
    maxSelect: 1,
    choices: [
      { id: 'lch-entera', name: 'Leche Entera', price: 0, isDefault: true },
      { id: 'lch-deslac', name: 'Leche Deslactosada', price: 0 },
      { id: 'lch-deslac-lt', name: 'Deslactosada Light', price: 0 },
      { id: 'lch-avena', name: 'Leche de Avena', price: 12 },
      { id: 'lch-almendra', name: 'Leche de Almendra', price: 12 },
      { id: 'lch-coco', name: 'Leche de Coco', price: 14 },
      { id: 'lch-soya', name: 'Leche de Soya', price: 10 },
      { id: 'lch-sin', name: 'Sin Leche (Negro)', price: 0 },
    ],
  },
  {
    id: 'grp-endulzantes',
    name: 'Endulzante',
    required: true,
    maxSelect: 1,
    choices: [
      { id: 'end-sin', name: 'Sin Azúcar', price: 0, isDefault: true },
      { id: 'end-mascabado', name: 'Azúcar Mascabado (1 sobre)', price: 0 },
      { id: 'end-blanca', name: 'Azúcar Estándar (1 sobre)', price: 0 },
      { id: 'end-splenda', name: 'Splenda (1 sobre)', price: 0 },
      { id: 'end-stevia', name: 'Stevia Natural (1 sobre)', price: 0 },
      { id: 'end-miel', name: 'Miel de Abeja Pura', price: 8 },
      { id: 'end-jarabe-vainilla', name: 'Jarabe de Vainilla Francesa', price: 10 },
      { id: 'end-jarabe-caramelo', name: 'Jarabe de Caramelo Salado', price: 10 },
      { id: 'end-jarabe-avellana', name: 'Jarabe de Avellana Tostada', price: 10 },
    ],
  },
  {
    id: 'grp-tamano',
    name: 'Tamaño',
    required: true,
    maxSelect: 1,
    choices: [
      { id: 'tam-chico', name: 'Chico (8 oz)', price: -5 },
      { id: 'tam-regular', name: 'Regular (12 oz)', price: 0, isDefault: true },
      { id: 'tam-grande', name: 'Grande (16 oz)', price: 10 },
      { id: 'tam-jumbo', name: 'Jumbo (20 oz)', price: 18 },
    ],
  },
  {
    id: 'grp-temperatura',
    name: 'Temperatura',
    required: true,
    maxSelect: 1,
    choices: [
      { id: 'temp-caliente', name: 'Caliente', price: 0, isDefault: true },
      { id: 'temp-tibio', name: 'Tibio (para niños / prisa)', price: 0 },
      { id: 'temp-extra', name: 'Extra Caliente', price: 0 },
      { id: 'temp-hielo', name: 'Con Hielo (Iced)', price: 5 },
    ],
  },
  {
    id: 'grp-extras',
    name: 'Extras & Personalización',
    required: false,
    maxSelect: 4,
    choices: [
      { id: 'ext-shot', name: 'Shot Extra de Espresso', price: 16 },
      { id: 'ext-crema', name: 'Crema Batida Artesanal', price: 12 },
      { id: 'ext-canela', name: 'Espolvoreado con Canela', price: 0 },
      { id: 'ext-cacao', name: 'Cacao Holandés 100%', price: 5 },
      { id: 'ext-descafeinado', name: 'Preparar Descafeinado', price: 0 },
    ],
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-capuchino',
    name: 'Capuchino Artesanal',
    category: 'Cafés Clásicos',
    basePrice: 55,
    description: 'Espresso de tueste medio balanceado con leche texturizada sedosa y corona de microespuma.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0], // Leche
      DEFAULT_OPTION_TEMPLATES[1], // Endulzante
      DEFAULT_OPTION_TEMPLATES[2], // Tamaño
      DEFAULT_OPTION_TEMPLATES[3], // Temperatura
      DEFAULT_OPTION_TEMPLATES[4], // Extras
    ],
  },
  {
    id: 'prod-latte',
    name: 'Café Latte Cremoso',
    category: 'Cafés Clásicos',
    basePrice: 58,
    description: 'Doble shot de espresso suave con generosa capa de leche emulsionada.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0],
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[2],
      DEFAULT_OPTION_TEMPLATES[3],
      DEFAULT_OPTION_TEMPLATES[4],
    ],
  },
  {
    id: 'prod-americano',
    name: 'Café Americano',
    category: 'Cafés Clásicos',
    basePrice: 42,
    description: 'Espresso doble rebajado con agua filtrada a temperatura perfecta. Sabor limpio y aromático.',
    available: true,
    optionGroups: [
      {
        id: 'grp-leche-opcional',
        name: 'Toque de Leche (Opcional)',
        required: false,
        maxSelect: 1,
        choices: [
          { id: 'lch-ninguna', name: 'Sin leche (Negro tradicional)', price: 0, isDefault: true },
          { id: 'lch-gotas-entera', name: 'Cortado con Leche Entera', price: 0 },
          { id: 'lch-gotas-deslac', name: 'Cortado con Deslactosada', price: 0 },
          { id: 'lch-gotas-avena', name: 'Cortado con Avena', price: 8 },
        ],
      },
      DEFAULT_OPTION_TEMPLATES[1], // Endulzante
      DEFAULT_OPTION_TEMPLATES[2], // Tamaño
      DEFAULT_OPTION_TEMPLATES[3], // Temp
      {
        id: 'grp-extras-americano',
        name: 'Extras',
        required: false,
        maxSelect: 2,
        choices: [
          { id: 'ext-shot-am', name: 'Shot Extra de Espresso', price: 16 },
          { id: 'ext-descafeinado-am', name: 'Granos Descafeinados', price: 0 },
        ],
      },
    ],
  },
  {
    id: 'prod-flat-white',
    name: 'Flat White Australiano',
    category: 'Cafés Clásicos',
    basePrice: 60,
    description: 'Doble ristretto intenso con leche microtexturizada fina sin capa gruesa de espuma.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0],
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[3],
    ],
  },
  {
    id: 'prod-espresso',
    name: 'Espresso Doble',
    category: 'Cafés Clásicos',
    basePrice: 38,
    description: 'Doble extracción pura de café de especialidad con crema avellanada densa.',
    available: true,
    optionGroups: [
      {
        id: 'grp-tipo-espresso',
        name: 'Estilo de Extracción',
        required: true,
        maxSelect: 1,
        choices: [
          { id: 'esp-doble', name: 'Doble Tradicional (60ml)', price: 0, isDefault: true },
          { id: 'esp-ristretto', name: 'Ristretto Corto (Intenso)', price: 0 },
          { id: 'esp-lungo', name: 'Lungo Largo', price: 0 },
          { id: 'esp-macchiato', name: 'Cortado / Macchiato', price: 5 },
        ],
      },
      DEFAULT_OPTION_TEMPLATES[1],
    ],
  },
  {
    id: 'prod-caramel-macchiato',
    name: 'Caramel Macchiato',
    category: 'Especialidades',
    basePrice: 68,
    description: 'Leche al vapor con jarabe de vainilla, manchada con espresso y bañada en caramelo artesanal.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0],
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[2],
      DEFAULT_OPTION_TEMPLATES[3],
      DEFAULT_OPTION_TEMPLATES[4],
    ],
  },
  {
    id: 'prod-mocha',
    name: 'Mocha Suizo',
    category: 'Especialidades',
    basePrice: 66,
    description: 'Espresso combinado con salsa de cacao puro holandés, leche cremosa y crema batida.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0],
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[2],
      DEFAULT_OPTION_TEMPLATES[3],
      DEFAULT_OPTION_TEMPLATES[4],
    ],
  },
  {
    id: 'prod-cold-brew',
    name: 'Cold Brew de la Casa',
    category: 'Bebidas Frías',
    basePrice: 58,
    description: 'Extracción lenta en frío durante 18 horas. Notas a chocolate amargo y baja acidez.',
    available: true,
    optionGroups: [
      {
        id: 'grp-nube-coldbrew',
        name: 'Topping o Nube de Leche',
        required: true,
        maxSelect: 1,
        choices: [
          { id: 'cb-solo', name: 'Solo con hielo (Puro)', price: 0, isDefault: true },
          { id: 'cb-nube-vainilla', name: 'Nube de crema dulce de Vainilla', price: 12 },
          { id: 'cb-nube-avena', name: 'Nube de Avena Canela', price: 14 },
          { id: 'cb-leche-deslac', name: 'Splash Leche Deslactosada', price: 6 },
        ],
      },
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[2],
    ],
  },
  {
    id: 'prod-chai-latte',
    name: 'Chai Latte Especiado',
    category: 'Especialidades',
    basePrice: 62,
    description: 'Infusión de té negro con canela, cardamomo, clavo, jengibre y leche espumada.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0],
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[2],
      DEFAULT_OPTION_TEMPLATES[3],
      {
        id: 'grp-dirty-chai',
        name: 'Dirty Chai (Shot de Espresso)',
        required: false,
        maxSelect: 1,
        choices: [
          { id: 'ch-sin-shot', name: 'Sin café (Clásico)', price: 0, isDefault: true },
          { id: 'ch-con-shot', name: 'Dirty Chai (+ 1 Shot Espresso)', price: 16 },
        ],
      },
    ],
  },
  {
    id: 'prod-matcha-latte',
    name: 'Matcha Latte Ceremonial',
    category: 'Especialidades',
    basePrice: 65,
    description: 'Té verde matcha grado ceremonial japonés batido con leche espumada suave.',
    available: true,
    optionGroups: [
      DEFAULT_OPTION_TEMPLATES[0],
      DEFAULT_OPTION_TEMPLATES[1],
      DEFAULT_OPTION_TEMPLATES[2],
      DEFAULT_OPTION_TEMPLATES[3],
    ],
  },
  {
    id: 'prod-croissant',
    name: 'Croissant Francés de Mantequilla',
    category: 'Repostería & Panadería',
    basePrice: 45,
    description: 'Hojaldre horneado diario con mantequilla europea pura, dorado y crujiente.',
    available: true,
    optionGroups: [
      {
        id: 'grp-calentado',
        name: 'Servicio',
        required: true,
        maxSelect: 1,
        choices: [
          { id: 'cr-caliente', name: 'Calientito recién horneado', price: 0, isDefault: true },
          { id: 'cr-temp-amb', name: 'Temperatura ambiente', price: 0 },
        ],
      },
      {
        id: 'grp-croissant-relleno',
        name: 'Acompañamiento',
        required: false,
        maxSelect: 2,
        choices: [
          { id: 'cr-nutella', name: 'Nutella para untar', price: 14 },
          { id: 'cr-mermelada', name: 'Mermelada de frutos rojos', price: 10 },
          { id: 'cr-queso', name: 'Queso crema', price: 12 },
        ],
      },
    ],
  },
  {
    id: 'prod-bagel',
    name: 'Bagel Artesanal de Masa Madre',
    category: 'Repostería & Panadería',
    basePrice: 52,
    description: 'Tostado al momento con semillas de ajonjolí y amapola.',
    available: true,
    optionGroups: [
      {
        id: 'grp-bagel-prep',
        name: 'Untable',
        required: true,
        maxSelect: 1,
        choices: [
          { id: 'bg-queso-crema', name: 'Queso crema tradicional', price: 0, isDefault: true },
          { id: 'bg-mantequilla', name: 'Mantequilla con sal', price: 0 },
          { id: 'bg-aguacate', name: 'Aguacate machacado & aceite oliva', price: 18 },
        ],
      },
      {
        id: 'grp-bagel-tostado',
        name: 'Tostado',
        required: true,
        maxSelect: 1,
        choices: [
          { id: 'bg-tostado-medio', name: 'Tostado medio', price: 0, isDefault: true },
          { id: 'bg-muy-tostado', name: 'Bien crujiente', price: 0 },
        ],
      },
    ],
  },
];

export const CATEGORIES = [
  'Todos',
  'Cafés Clásicos',
  'Especialidades',
  'Bebidas Frías',
  'Repostería & Panadería',
];
