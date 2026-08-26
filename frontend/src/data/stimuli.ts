export interface Stimulus {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  audioPrompt: string;
  isScenario?: boolean;
  dialectsData?: {
    [key: string]: {
      standard: string;
      phonetic: string;
      audioMockText: string;
      lexicalNotes: string;
    };
  };
}

const BASE_STIMULI: Stimulus[] = [
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

const generateScenarios = (): Stimulus[] => {
  const categories = [
    {
      name: "Family & Greetings",
      scenarios: [
        "When you wake in the morning, how do you greet your elderly ones?",
        "How do you introduce your younger sibling to an uncle visiting from abroad?",
        "Your mother cooked a delicious meal. How do you thank her after eating?",
        "How do you greet your grandfather on his 80th birthday?",
        "You are welcoming your father back from a long business trip. What do you say?",
        "How do you apologize to your mother after accidentally breaking her favorite plate?",
        "How do you console your sister who is sad about losing her school competition?",
        "Your family is gathered for dinner. How do you say grace before meals?",
        "How do you ask your uncle for a small pocket money gift politely?",
        "Your grandmother tells you a folk story. How do you show appreciation at the end?"
      ]
    },
    {
      name: "Market & Commerce",
      scenarios: [
        "If you sell in the market and a customer comes, how do you welcome them and find out what they want?",
        "How do you bargain with a market woman who is selling a basket of tomatoes too high?",
        "You want to buy fresh fish. How do you ask the seller if the fish was caught today?",
        "How do you tell a vendor that their goods are of high quality, but you cannot afford their price?",
        "How do you politely demand your correct balance (change) from a commercial bus conductor?",
        "You want to buy a bag of garri. How do you ask the seller to measure it for you?",
        "A customer is complaining about the price of your goods. How do you convince them to buy?",
        "How do you ask a fellow buyer in the market where to find the best local palm oil?",
        "How do you tell a tailor that the clothes they made for you are too tight?",
        "You want to pay for goods with mobile transfer. How do you ask the vendor for their bank details?"
      ]
    },
    {
      name: "School & Education",
      scenarios: [
        "You are late for a class. How do you apologize to the teacher and ask for permission to enter?",
        "How do you ask a classmate to lend you a pen during a test?",
        "Your teacher explains a math problem, but you don't understand. How do you ask them to repeat it?",
        "How do you congratulate a classmate who came first in the class examination?",
        "How do you ask the school librarian where to find historical books about Nigeria?",
        "You want to form a study group. How do you invite your friends to join you?",
        "How do you tell your teacher that you were absent yesterday because you were sick?",
        "You are defending a point in a school debate. How do you start your speech?",
        "How do you ask your principal for permission to leave school early to visit the hospital?",
        "Your classmate lost their school bag. How do you ask others to help search for it?"
      ]
    },
    {
      name: "Social & Community",
      scenarios: [
        "How do you greet your neighbor who is sitting on their porch in the evening?",
        "A new neighbor just moved in next door. How do you welcome them to the street?",
        "How do you ask a passerby for directions to the nearest post office or hospital?",
        "How do you thank a neighbor who helped you carry a heavy load of water?",
        "A community meeting is about to start. How do you call everyone to order?",
        "How do you warn a child playing near the road about an oncoming car?",
        "How do you invite your neighbor to your child's dedication ceremony next weekend?",
        "How do you offer condolences to a neighbor who just lost a family member?",
        "How do you ask the community youth leader how to register for the local cleanup project?",
        "How do you settle a small dispute between two neighbors arguing over parking space?"
      ]
    },
    {
      name: "Faith & Worship",
      scenarios: [
        "You are entering a Catholic church. How do you greet the parish priest?",
        "You are welcoming a new member to your Protestant fellowship. What do you say?",
        "How do you invite a friend to attend a special harvest thanksgiving service at your church?",
        "You are greeting a Muslim friend during Eid celebrations. What do you say?",
        "How do you request a prayer from your local Imam or Pastor during a difficult time?",
        "How do you congratulate a friend who just completed the Ramadan fast?",
        "How do you lead a short opening prayer before a family fellowship session?",
        "How do you greet church elders after Sunday service?",
        "How do you ask a mosque volunteer where to perform ablution (wudu)?",
        "How do you share a testimony of healing during a weekly testimony service?"
      ]
    },
    {
      name: "Leisure & Public Spaces",
      scenarios: [
        "You are at a game center. How do you ask the attendant how much a token costs?",
        "How do you ask a stranger at a park if you can sit on the empty space on their bench?",
        "You are at a shopping mall. How do you ask a sales agent where the electronics section is?",
        "You are checking into a hotel. How do you tell the receptionist you have a reservation?",
        "How do you ask a hotel receptionist if breakfast is included in your room rate?",
        "How do you tell a restaurant waiter that they brought the wrong food order?",
        "You are at a local park. How do you ask a group of boys if you can join their football game?",
        "How do you ask a shopkeeper at the mall if they have a discount on their clothing items?",
        "How do you ask a cinema cashier for two tickets to the afternoon movie?",
        "How do you tell a hotel room service attendant that your bathroom tap is leaking?"
      ]
    },
    {
      name: "Household Tasks",
      scenarios: [
        "You are teaching a younger child how to fold bedsheets neatly. What instructions do you give?",
        "How do you ask your brother to help you sort the white clothes before doing the laundry?",
        "You are dicing onions in the kitchen. How do you tell your sister to bring the dry pepper?",
        "How do you instruct someone on how to arrange firewood to set a fast-burning fire?",
        "You are sweeping the compound. How do you ask someone to fetch the dustbin?",
        "How do you explain to a helper how to wash bitter leaves to remove the bitterness for soup?",
        "You are boiling yams. How do you check if they are soft enough by poking them with a fork?",
        "How do you warn someone to be careful when lighting the kerosene stove?",
        "How do you tell your sibling that the tap is running and they should turn it off?",
        "How do you instruct someone to wash the mortar and pestle immediately after pounding?"
      ]
    },
    {
      name: "Local Delicacies",
      scenarios: [
        "You are eating semo with egusi soup. How do you describe the taste to a guest?",
        "How do you ask your host to add more hot soup over your akpu mound?",
        "You want to buy abacha (African salad). How do you instruct the seller on the quantity of garden eggs to add?",
        "How do you explain to a visitor why you prefer eating solid swallows with your hands?",
        "You are eating roasted plantain (boli) with groundnuts. How do you express how delicious it is?",
        "How do you ask your sister if the ugba in the soup is soft enough to eat?",
        "You are serving fresh palm wine. How do you tell your guests to drink it before it turns sour?",
        "How do you ask a restaurant seller to give you a combination of beef and shaki in your soup?",
        "You are eating hot pepper soup. How do you tell the cook that it is spicy but very sweet?",
        "How do you explain to someone how to chew local garden eggs with peanut paste?"
      ]
    },
    {
      name: "Travel & Transit",
      scenarios: [
        "You are preparing to travel. How do you list the items you need to pack in your bag?",
        "How do you ask a commercial bus driver if they are heading towards the local airport?",
        "You are at a garage. How do you negotiate the transport fare with a taxi driver?",
        "How do you tell a fellow passenger to adjust slightly so you can sit comfortably?",
        "How do you ask the driver to stop at the next junction so you can drop off?",
        "Your luggage is heavy. How do you ask a helper at the station to help you lift it?",
        "How do you ask a ticket seller when the next luxury bus to Abuja is leaving?",
        "How do you tell the driver that he is speeding and should slow down for safety?",
        "You arrived at your destination. How do you ask someone where to find a cheap hotel?",
        "How do you bid goodbye to your family before boarding a long-distance bus?"
      ]
    },
    {
      name: "Health & Fitness",
      scenarios: [
        "You are lifting weights. How do you ask a gym partner to spot you?",
        "How do you describe a sharp pain in your waist to a local pharmacist?",
        "How do you tell your fitness trainer that you are too tired to continue the exercise?",
        "How do you ask a nurse at the clinic for your blood pressure card?",
        "How do you explain to a doctor that you have been having chills and fever since yesterday?",
        "How do you instruct a child on how to take their malaria syrup dose?",
        "How do you ask a gym receptionist for the monthly membership pricing?",
        "How do you tell your teammate that you sprained your ankle during the football match?",
        "How do you ask a pharmacist if they have a cheaper generic brand of the prescribed medicine?",
        "How do you tell someone that doing early morning jogging keeps your body fit?"
      ]
    }
  ];

  const list: Stimulus[] = [];
  let idxVal = 1;
  
  for (const cat of categories) {
    // Original 10
    cat.scenarios.forEach((s, idx) => {
      list.push({
        id: `scenario-${idxVal++}`,
        title: `${cat.name} Scenario #${idx + 1}`,
        category: cat.name,
        description: s,
        audioPrompt: `Translate and speak this scenario in your dialect: "${s}"`,
        isScenario: true
      });
    });
    // Varied 10 to reach 20 per category (20 * 10 = 200 scenarios total!)
    cat.scenarios.forEach((s, idx) => {
      let varied = s;
      if (s.includes("elderly ones")) varied = s.replace("elderly ones", "parents");
      else if (s.includes("uncle")) varied = s.replace("uncle", "aunt");
      else if (s.includes("mother")) varied = s.replace("mother", "father");
      else if (s.includes("classmate")) varied = s.replace("classmate", "friend");
      else if (s.includes("neighbor")) varied = s.replace("neighbor", "landlord");
      else if (s.includes("Catholic")) varied = s.replace("Catholic", "Anglican");
      else if (s.includes("Muslim")) varied = s.replace("Muslim", "Christian");
      else if (s.includes("waiter")) varied = s.replace("waiter", "chef");
      else if (s.includes("firewood")) varied = s.replace("firewood", "charcoal");
      else varied = s + " Explain clearly.";

      list.push({
        id: `scenario-${idxVal++}`,
        title: `${cat.name} Scenario #${idx + 11}`,
        category: cat.name,
        description: varied,
        audioPrompt: `Translate and speak this scenario in your dialect: "${varied}"`,
        isScenario: true
      });
    });
  }
  return list;
};

export const STIMULI: Stimulus[] = BASE_STIMULI.concat(generateScenarios());

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
