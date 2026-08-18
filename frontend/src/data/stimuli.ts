export interface Stimulus {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  audioPrompt: string;
  dialectsData?: {
    [key: string]: {
      standard: string;
      phonetic: string;
      audioMockText: string;
      lexicalNotes: string;
    };
  };
}

export const STIMULI: Stimulus[] = [
  {
    id: "stim-akara",
    title: "Fried Akara",
    category: "Food",
    description: "Fresh golden fried akara (bean cakes) resting in a tray.",
    imageUrl: "/images/akara.jfif",
    audioPrompt: "Describe the fried akara and how it is made or presented."
  },
  {
    id: "stim-banana",
    title: "Bunch of Bananas",
    category: "Agriculture",
    description: "A ripe yellow bunch of bananas hanging from a branch.",
    imageUrl: "/images/banana.jfif",
    audioPrompt: "Describe this bunch of bananas and their condition."
  },
  {
    id: "stim-bowing",
    title: "Bowing in Respect",
    category: "Culture",
    description: "A younger person bowing down as a sign of respect in a cultural greeting.",
    imageUrl: "/images/bowing.jfif",
    audioPrompt: "Describe the act of bowing as a gesture of cultural respect."
  },
  {
    id: "stim-danfo-traffic",
    title: "Danfo Bus in Traffic",
    category: "Urban Life",
    description: "A yellow Danfo bus stuck in Lagos city road traffic.",
    imageUrl: "/images/danfo_in_traffic.jfif",
    audioPrompt: "Describe the yellow transit bus in traffic."
  },
  {
    id: "stim-delicacies",
    title: "Nigerian Delicacies",
    category: "Food",
    description: "A spread of traditional Nigerian dishes and side treats on a table.",
    imageUrl: "/images/delicacies.jfif",
    audioPrompt: "Describe the dishes and side delicacies visible here."
  },
  {
    id: "stim-classroom",
    title: "Old School Classroom",
    category: "Education",
    description: "A rustic classroom set up with wooden desks and blackboards.",
    imageUrl: "/images/dented classroom.jfif",
    audioPrompt: "Describe this local school classroom."
  },
  {
    id: "stim-dog",
    title: "Domestic Dog",
    category: "Animals",
    description: "A domestic guard dog sitting alert outside a compound.",
    imageUrl: "/images/dog.jfif",
    audioPrompt: "Describe the dog's appearance and posture."
  },
  {
    id: "stim-road",
    title: "Empty Road",
    category: "Infrastructure",
    description: "A quiet, paved road winding through trees without any vehicles.",
    imageUrl: "/images/empty road.jfif",
    audioPrompt: "Describe this empty paved road."
  },
  {
    id: "stim-feeding-goats",
    title: "Feeding Goats",
    category: "Agriculture",
    description: "A person feeding green leaves to a flock of domestic goats.",
    imageUrl: "/images/feeding_goats.jfif",
    audioPrompt: "Describe the action of feeding the goats."
  },
  {
    id: "stim-fried-akara",
    title: "Frying Akara",
    category: "Food Preparation",
    description: "Akara balls being deep-fried in hot oil inside a large local pan.",
    imageUrl: "/images/fried_akara.jfif",
    audioPrompt: "Describe the process of deep-frying akara."
  },
  {
    id: "stim-gele",
    title: "Yoruba Gele Headtie",
    category: "Culture",
    description: "A woman elegantly wearing a colorful, folded Yoruba Gele headtie.",
    imageUrl: "/images/gele.jfif",
    audioPrompt: "Describe the style and folds of this Gele headtie."
  },
  {
    id: "stim-gele-2",
    title: "Festive Gele Style",
    category: "Culture",
    description: "Another style of traditional folded Gele headgear for celebrations.",
    imageUrl: "/images/gele_2.jfif",
    audioPrompt: "Describe the colors and arrangement of this Gele."
  },
  {
    id: "stim-goat-pen",
    title: "Goat in a Pen",
    category: "Animals",
    description: "A brown goat standing inside a rustic wooden pen.",
    imageUrl: "/images/goat_in_pen.jfif",
    audioPrompt: "Describe the goat inside the farm pen."
  },
  {
    id: "stim-hens",
    title: "Flock of Hens",
    category: "Animals",
    description: "A small flock of local chickens pecking at the ground for grains.",
    imageUrl: "/images/hens.jfif",
    audioPrompt: "Describe the group of hens in the yard."
  },
  {
    id: "stim-hunting-men",
    title: "Men in the Forest",
    category: "Community",
    description: "A group of local men standing in the forest, prepared for a hunting trip.",
    imageUrl: "/images/hunting men.jfif",
    audioPrompt: "Describe the men standing in the forest."
  },
  {
    id: "stim-ichafu",
    title: "Igbo Ichafu Headtie",
    category: "Culture",
    description: "A traditional Igbo woman wearing a beautifully folded Ichafu headscarf.",
    imageUrl: "/images/ichafu.jfif",
    audioPrompt: "Describe this Igbo headtie styling."
  },
  {
    id: "stim-jumping",
    title: "Jumping in Celebration",
    category: "Activities",
    description: "A man jumping high into the air in a moment of celebration.",
    imageUrl: "/images/jumping man.jfif",
    audioPrompt: "Describe the jumping man and his expression."
  },
  {
    id: "stim-local-cup",
    title: "Traditional Drinking Cup",
    category: "Household",
    description: "A traditional carved wooden cup or calabash used for drinking.",
    imageUrl: "/images/local drinking cup.jfif",
    audioPrompt: "Describe this local drinking vessel."
  },
  {
    id: "stim-cash",
    title: "Man Counting Cash",
    category: "Commerce",
    description: "A man holding a stack of Nigerian Naira currency notes.",
    imageUrl: "/images/man with cash.jfif",
    audioPrompt: "Describe the action of holding or counting cash."
  },
  {
    id: "stim-selecting-goods",
    title: "Market Woman Selecting Goods",
    category: "Commerce",
    description: "A market vendor sorting out fresh fruits and goods at her stall.",
    imageUrl: "/images/market_woman_selecting_goods.jfif",
    audioPrompt: "Describe the vendor selecting and sorting goods."
  },
  {
    id: "stim-market-women",
    title: "Market Women Chatting",
    category: "Commerce",
    description: "Market sellers sitting together and chatting amidst their produce baskets.",
    imageUrl: "/images/market_women.jfif",
    audioPrompt: "Describe the women in the open-air market."
  },
  {
    id: "stim-moving-danfo",
    title: "Moving Danfo Bus",
    category: "Urban Life",
    description: "A yellow Lagos Danfo commercial bus speeding down the highway.",
    imageUrl: "/images/moving_danfo.jfif",
    audioPrompt: "Describe the yellow bus moving down the road."
  },
  {
    id: "stim-tapper-road",
    title: "Tapper Walking on Dirt Road",
    category: "Agriculture",
    description: "A palmwine tapper walking down a quiet rural dirt road carrying his climbing ropes.",
    imageUrl: "/images/palmwine_tapper_walking_on_untarred_road.jfif",
    audioPrompt: "Describe the tapper walking along the untarred road."
  },
  {
    id: "stim-pig-market",
    title: "Local Pig Market",
    category: "Agriculture",
    description: "A collection of domestic pigs housed inside wooden pens at a market.",
    imageUrl: "/images/pig_market.jfif",
    audioPrompt: "Describe the pigs in the market pen."
  },
  {
    id: "stim-pounding-pepper",
    title: "Pounding Pepper in Mortar",
    category: "Food Preparation",
    description: "Pounding fresh red peppers in a small wooden mortar using a pestle.",
    imageUrl: "/images/pounding_pepper_in_a_mortar.jfif",
    audioPrompt: "Describe the action of pounding pepper in the mortar."
  },
  {
    id: "stim-rabbit",
    title: "Rabbit with Carrots",
    category: "Animals",
    description: "A fluffy domestic rabbit nibbling on fresh orange carrots.",
    imageUrl: "/images/rabbit_and_carrots.jfif",
    audioPrompt: "Describe the rabbit and the carrots."
  },
  {
    id: "stim-settlement",
    title: "Remote Village Settlement",
    category: "Community",
    description: "A rustic village settlement with thatched mud houses and people gather outside.",
    imageUrl: "/images/remote_settlement_with_people.jfif",
    audioPrompt: "Describe this remote rural village settlement."
  },
  {
    id: "stim-boli-seller",
    title: "Roadside Boli Vendor",
    category: "Street Food",
    description: "A street vendor grilling sweet yellow plantains over hot charcoals.",
    imageUrl: "/images/roadside_boli_seller.jfif",
    audioPrompt: "Describe the vendor selling roasted plantains."
  },
  {
    id: "stim-boli-fish",
    title: "Roasted Plantain and Fish",
    category: "Street Food",
    description: "Hot roasted plantain (boli) served with grilled fish on a plate.",
    imageUrl: "/images/roasted_plantain_and_fish.jfif",
    audioPrompt: "Describe the dish of roasted plantain and fish."
  },
  {
    id: "stim-running",
    title: "Running Woman",
    category: "Activities",
    description: "A woman jogging or running along a path for exercise.",
    imageUrl: "/images/running woman.jfif",
    audioPrompt: "Describe the woman running."
  },
  {
    id: "stim-firewood",
    title: "Arranging Firewood",
    category: "Daily Tasks",
    description: "Stacking dry wooden logs together to set a cooking fire.",
    imageUrl: "/images/setting firewood.jfif",
    audioPrompt: "Describe the process of arranging firewood."
  },
  {
    id: "stim-sheeps",
    title: "Grazing Sheep",
    category: "Animals",
    description: "White sheep grazing on green grass in an open field.",
    imageUrl: "/images/sheeps.jfif",
    audioPrompt: "Describe the sheep grazing."
  },
  {
    id: "stim-talking-men",
    title: "Men in Cultural Meeting",
    category: "Community",
    description: "Elders sitting in a circle discussing community matters during a meeting.",
    imageUrl: "/images/talking men in meeting.jfif",
    audioPrompt: "Describe the elders talking in the meeting."
  },
  {
    id: "stim-tapping-wine",
    title: "Tapping Palm Wine",
    category: "Agriculture",
    description: "A tapper scaling a high palm tree to harvest fresh sap.",
    imageUrl: "/images/tapping_palm_wine.jfif",
    audioPrompt: "Describe the tapper climbing the palm tree."
  },
  {
    id: "stim-turkey",
    title: "Domestic Turkey",
    category: "Animals",
    description: "A large domestic turkey displaying its feathers in a farmyard.",
    imageUrl: "/images/turkey.jfif",
    audioPrompt: "Describe the turkey and its feathers."
  },
  {
    id: "stim-grinding-stone",
    title: "Grinding on a Stone",
    category: "Food Preparation",
    description: "Two women crushing peppers using a traditional flat grinding stone.",
    imageUrl: "/images/two_women_grinding_pepper_on_grinding_stone.jfif",
    audioPrompt: "Describe the women grinding pepper on the flat stone."
  },
  {
    id: "stim-cows",
    title: "Cattle Herd Walking",
    category: "Animals",
    description: "A herd of long-horned cattle walking down a grassy trail.",
    imageUrl: "/images/walking_cows.jfif",
    audioPrompt: "Describe the herd of cows walking."
  },
  {
    id: "stim-wedding",
    title: "Traditional Wedding Venue",
    category: "Culture",
    description: "A beautifully decorated event setting for a traditional wedding ceremony.",
    imageUrl: "/images/wedding settings.jfif",
    audioPrompt: "Describe the wedding venue decorations."
  },
  {
    id: "stim-white-mug",
    title: "White Mug on Table",
    category: "Household",
    description: "A clean white ceramic drinking mug sitting on a table.",
    imageUrl: "/images/white mug.jfif",
    audioPrompt: "Describe this white drinking mug."
  },
  {
    id: "stim-cooking",
    title: "Woman Cooking Outdoors",
    category: "Food Preparation",
    description: "A woman cooking a meal over a traditional open three-stone firewood hearth.",
    imageUrl: "/images/woman cooking.jfif",
    audioPrompt: "Describe the woman cooking on the firewood fire."
  }
];

export const LANGUAGES_AND_DIALECTS = {
  "Igbo": [
    "Onitsha",
    "Mgbowo",
    "Owerri",
    "Abiriba",
    "Nnewi",
    "Nsukka",
    "Umuahia",
    "Ngwa",
    "Arochukwu",
    "Others"
  ],
  "Yoruba": [
    "Standard Yoruba",
    "Oyo",
    "Ijebu",
    "Egba",
    "Ijesha",
    "Ekiti",
    "Ondo",
    "Yagba"
  ],
  "Hausa": [
    "Kano (Standard)",
    "Katsina",
    "Sokoto",
    "Zaria",
    "Gobir",
    "Daura"
  ],
  "Twi": [
    "Asante",
    "Akuapem",
    "Fante",
    "Bono"
  ],
  "Others (Efik, Ibibio, Jukun)": [
    "Efik (Calabar)",
    "Ibibio (Uyo)",
    "Jukun (Wukari)",
    "Jukun (Takum)",
    "Others"
  ]
};
