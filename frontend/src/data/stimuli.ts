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
    id: "stim-cup",
    title: "A Mug on a Table",
    category: "Household",
    description: "A standard drinking mug sitting on a flat wooden table surface.",
    imageUrl: "/cup.jpg",
    audioPrompt: "Describe this drinking vessel in your dialect.",
    dialectsData: {
      "Onitsha": {
        standard: "Ihe eji anụ mmiri dị na tebulu.",
        phonetic: "Ihe eji anụ mmiri dị na tebulu",
        audioMockText: "Kọpụ eji anụ mmiri sị n'elu tebulu.",
        lexicalNotes: "Uses 'Kọpụ' (borrowed) and 'sị' (sitting/originating)."
      },
      "Abiriba": {
        standard: "Ihe awiko, ndyo ibo nakwea kop, eji ya umiri, ona cho baro obara.",
        phonetic: "Ihe awiko, ndyo ibo nakwea kop, eji ya umiri...",
        audioMockText: "Ihe awiko ndyo ibo nakwea kop, eji ya umiri, ona cho baro obara.",
        lexicalNotes: "Uses distinct vocabulary for vessel ('awiko') and water/fluid ('umiri')."
      },
      "Nnewi": {
        standard: "Ihe eji añụ mmiri tọrọ n'elu tebulu.",
        phonetic: "Ihe eji añụ mmiri tọrọ n'elu tebulu",
        audioMockText: "Ihe eji añụ mmiri tọrọ n'elu tebulu.",
        lexicalNotes: "Uses 'tọrọ' (placed/resting) and standard 'ñụ' for drink."
      },
      "Owerri": {
        standard: "Ihe eji añụ mmiri dị n'elu tebulu.",
        phonetic: "Ihe eji añụ mmiri dị n'elu tebulu",
        audioMockText: "Kọpụ eji añụ mmiri dị n'elu tebulu.",
        lexicalNotes: "Classic Central/Owerri dialect structure."
      }
    }
  },
  {
    id: "stim-pepper",
    title: "Grinding Pepper in a Mortar",
    category: "Daily Chores",
    description: "A woman grinding fresh red peppers using a traditional wooden mortar and pestle.",
    imageUrl: "https://images.unsplash.com/photo-1618037372808-f65e824a305b?auto=format&fit=crop&w=600&q=80",
    audioPrompt: "Describe the action of grinding pepper using these tools.",
    dialectsData: {
      "Onitsha": {
        standard: "Nwanyị na-asụ ose n'ikwe.",
        phonetic: "Nwanyị na-asụ ose n'ikwe",
        audioMockText: "Nwanyị ọ na-asụ ose na mpata ikwe.",
        lexicalNotes: "Uses standard 'asụ' (grinding/pounding) and 'ikwe' (mortar)."
      },
      "Abiriba": {
        standard: "Nwanyị na-agbaji ose n'okwe.",
        phonetic: "Nwanyị na-agbaji ose n'okwe",
        audioMockText: "Nwanyị na-agbaji ose n'okwe na aka okwe.",
        lexicalNotes: "Uses 'agbaji' for grinding/crushing and 'okwe' instead of 'ikwe'."
      },
      "Owerri": {
        standard: "Nwaanyi na-asu ose n'ime ikwe.",
        phonetic: "Nwaanyi na-asu ose n'ime ikwe",
        audioMockText: "Nwaanyi na-asu ose n'ime ikwe.",
        lexicalNotes: "Standard Owerri pronunciation of 'Nwaanyi' and 'ikwe'."
      }
    }
  },
  {
    id: "stim-palmwine",
    title: "Tapping Palm Wine",
    category: "Agriculture",
    description: "A traditional palm wine tapper climbing a tall palm tree with a rope harness to harvest sap.",
    imageUrl: "https://images.unsplash.com/photo-1508213981460-0722d4f215d1?auto=format&fit=crop&w=600&q=80",
    audioPrompt: "Describe the tapper climbing the tree to harvest palm wine.",
    dialectsData: {
      "Onitsha": {
        standard: "Dịnta nkwu na-arịgo nkwu ka ọ gbanye mmiri nkwu.",
        phonetic: "Dịnta nkwu na-arịgo nkwu ka ọ gbanye mmiri nkwu",
        audioMockText: "Dịnta nkwu na-arịgo nkwu ka ọ gbanye mmiri nkwu.",
        lexicalNotes: "Uses 'Dịnta nkwu' (palm wine hunter/tapper) and 'arịgo' (climbing up)."
      },
      "Owerri": {
        standard: "Eze nkwu na-arị nkwu ka ọ gbata mmanya nkwu.",
        phonetic: "Eze nkwu na-arị nkwu ka ọ gbata mmanya nkwu",
        audioMockText: "Eze nkwu na-arị nkwu ka ọ gbata mmanya nkwu.",
        lexicalNotes: "Uses 'Eze nkwu' (king/tapper of palm) or 'ọgbaji nkwu' and 'gbata' (to draw/tap)."
      },
      "Abiriba": {
        standard: "Onye ọbá nkwụ na-arị nkwụ ka ọ gbata mmañá.",
        phonetic: "Onye ọbá nkwụ na-arị nkwụ...",
        audioMockText: "Onye ọbá nkwụ na-arị nkwụ ka ọ gbata mmañá nkwụ.",
        lexicalNotes: "Distinct tonal notation and 'mmañá' for wine."
      }
    }
  },
  {
    id: "stim-market",
    title: "Vibrant Market Bargaining",
    category: "Commerce",
    description: "A crowded open-air market market stall with colorful produce and people bargaining.",
    imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80",
    audioPrompt: "Describe the busy market scene and the trade interaction.",
    dialectsData: {
      "Onitsha": {
        standard: "Afia na-azu, ndi mmadu na-azụta nni.",
        phonetic: "Afia na-azu, ndi mmadu na-azụta nni",
        audioMockText: "Afia na-azu nke ọma, ndi mmadu na-azụta nni.",
        lexicalNotes: "Uses 'Afia' (market) instead of 'Ahịa', and 'nni' (food) instead of 'nri'."
      },
      "Owerri": {
        standard: "Ahịa na-azu, ndị mmadụ na-azụta nri.",
        phonetic: "Ahịa na-azu, ndị mmadụ na-azụta nri",
        audioMockText: "Ahịa na-azu nke ọma, ndị mmadụ na-azụta nri.",
        lexicalNotes: "Uses standard 'Ahịa' and 'nri'."
      },
      "Nsukka": {
        standard: "Ẹya na-adụ, ndụ madụ na-azụta ẹrẹ.",
        phonetic: "Ẹya na-adụ, ndụ madụ...",
        audioMockText: "Ẹya na-adụ ọfụma, ndụ madụ na-azụta ẹrẹ.",
        lexicalNotes: "Uses Nsukka dialect terms: 'Ẹya' (market), 'madụ' (people), and 'ẹrẹ' (food/provisions)."
      }
    }
  },
  {
    id: "stim-pounding-yam",
    title: "Pounding Yam in a Mortar",
    category: "Food Preparation",
    description: "Two young men rhythmically pounding boiled yams in a large wooden mortar with heavy pestles.",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
    audioPrompt: "Describe the men pounding yam and the tools they are using.",
    dialectsData: {
      "Onitsha": {
        standard: "Ụmụ nwoke abụọ na-asụ ji n'ikwe.",
        phonetic: "Ụmụ nwoke abụọ na-asụ ji n'ikwe",
        audioMockText: "Ndị nwoke abụọ na-asụ ji n'ikwe.",
        lexicalNotes: "Uses 'Ụmụ nwoke' and standard 'asụ ji' (pounding yam)."
      },
      "Owerri": {
        standard: "Ụmụ nwoke abụọ na-asụ ji n'ime ikwe.",
        phonetic: "Ụmụ nwoke abụọ na-asụ ji n'ime ikwe",
        audioMockText: "Ụmụ nwoke abụọ na-asụ ji n'ime ikwe na mgbakwunye.",
        lexicalNotes: "Uses standard 'ikwe' and Central Owerri phrasing."
      },
      "Abiriba": {
        standard: "Ụmụ nwoke abụọ na-agbaji ji n'okwe.",
        phonetic: "Ụmụ nwoke abụọ na-agbaji ji n'okwe",
        audioMockText: "Ụmụ nwoke abụọ na-agbaji ji n'okwe.",
        lexicalNotes: "Uses 'agbaji' for pounding/crushing action and 'okwe' instead of 'ikwe'."
      }
    }
  },
  {
    id: "stim-danfo",
    title: "Danfo Buses in Traffic",
    category: "Urban Life",
    description: "Iconic yellow Danfo transit buses lined up in traffic under a flyover in Lagos.",
    imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80",
    audioPrompt: "Describe the heavy traffic and yellow commercial transit buses.",
    dialectsData: {
      "Onitsha": {
        standard: "Ọtụtụ bọs na-acha edo edo n'okporo ụzọ n'ime afia.",
        phonetic: "Ọtụtụ bọs na-acha edo edo n'okporo ụzọ...",
        audioMockText: "Bọs Danfo na-acha edo edo tọrọ n'okporo ụzọ.",
        lexicalNotes: "Refers to yellow color 'acha edo edo'."
      },
      "Owerri": {
        standard: "Ọtụtụ bọs na-acha edo edo n'okporo ụzọ na tọrafịkị.",
        phonetic: "Ọtụtụ bọs na-acha edo edo na tọrafịkị",
        audioMockText: "Bọs Danfo tọrọ na tọrafịkị n'okporo ụzọ Lagos.",
        lexicalNotes: "Uses English loanword 'tọrafịkị' adapted to Igbo orthography."
      }
    }
  },
  {
    id: "stim-boli",
    title: "Roadside Boli Vendor",
    category: "Street Food",
    description: "A vendor roasting sweet yellow plantains (boli) and fresh fish over an open-air charcoal grill.",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
    audioPrompt: "Describe the roadside vendor roasting plantains over hot charcoal.",
    dialectsData: {
      "Onitsha": {
        standard: "Nwanyị na-arii unere (boli) n'okporo ụzọ.",
        phonetic: "Nwanyị na-arii unere n'okporo ụzọ",
        audioMockText: "Nwanyị na-arii unere n'elu unyị ọkụ.",
        lexicalNotes: "Uses 'unere' for plantain/banana."
      },
      "Owerri": {
        standard: "Nwaanyi na-asa ugede n'elu unyi oku.",
        phonetic: "Nwaanyi na-asa ugede n'elu unyi oku",
        audioMockText: "Nwaanyi na-asa ugede n'elu unyi oku n'okporo uzo.",
        lexicalNotes: "Uses 'ugede' or 'abirika' for plantain, and 'asa' (roasting/toasting)."
      }
    }
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
  "Efik / Ibibio": [
    "Calabar",
    "Uyo",
    "Oron",
    "Eket"
  ],
  "Swahili (Kiswahili)": [
    "Kiunguja (Standard)",
    "Kimvita",
    "Kiamu",
    "Kingwana"
  ],
  "Amharic": [
    "Addis Ababa (Standard)",
    "Gojjam",
    "Gondar",
    "Wollo"
  ],
  "Zulu (isiZulu)": [
    "KwaZulu-Natal (Standard)",
    "Transvaal",
    "Qwabe"
  ],
  "Wolof": [
    "Dakar (Standard)",
    "Saint-Louis",
    "Baol"
  ],
  "Xhosa (isiXhosa)": [
    "Gcaleka (Standard)",
    "Thembu",
    "Mpondo"
  ]
};
