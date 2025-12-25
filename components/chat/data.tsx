export const userData = [
  {
    id: 1,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
    messages: [
      {
        id: 1,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "Hey, Jakob",
      },
      {
        id: 2,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "Hey!",
      },
      {
        id: 3,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "How are you?",
      },
      {
        id: 4,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "I am good, you?",
      },
      {
        id: 5,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "I am good too!",
      },
      {
        id: 6,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "That is good to hear!",
      },
      {
        id: 7,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "How has your day been so far?",
      },
      {
        id: 8,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message:
          "It has been good. I went for a run this morning and then had a nice breakfast. How about you?",
      },
      {
        id: 9,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "I had a relaxing day. Just catching up on some reading.",
      },
    ],
    name: "Jakob Hoeg",
  },
  {
    id: 2,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jackson",
    name: "Jackson Lee",
    messages: [],
  },
  {
    id: 3,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Isabella",
    name: "Isabella Nguyen",
    messages: [],
  },
  {
    id: 4,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=William",
    name: "William Kim",
    messages: [],
  },
];

export type UserData = (typeof userData)[number];

export const loggedInUserData = {
  id: 5,
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=LoggedIn",
  name: "Jakob Hoeg",
};

export type LoggedInUserData = typeof loggedInUserData;

export interface Message {
  id: number;
  avatar: string;
  name: string;
  message: string;
}

export interface User {
  id: number;
  avatar: string;
  messages: Message[];
  name: string;
}
