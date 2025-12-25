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
        timestamp: "10:00 AM",
        status: "read",
      },
      {
        id: 2,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "Hey!",
        timestamp: "10:01 AM",
        status: "read",
      },
      {
        id: 3,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "How are you?",
        timestamp: "10:02 AM",
        status: "read",
      },
      {
        id: 4,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "I am good, you?",
        timestamp: "10:03 AM",
        status: "read",
      },
      {
        id: 5,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "I am good too!",
        timestamp: "10:04 AM",
        status: "read",
      },
      {
        id: 6,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "That is good to hear!",
        timestamp: "10:05 AM",
        status: "read",
      },
      {
        id: 7,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "How has your day been so far?",
        timestamp: "10:06 AM",
        status: "read",
      },
      {
        id: 8,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message:
          "It has been good. I went for a run this morning and then had a nice breakfast. How about you?",
        timestamp: "10:10 AM",
        status: "read",
      },
      {
        id: 9,
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jakob",
        name: "Jakob Hoeg",
        message: "I had a relaxing day. Just catching up on some reading.",
        timestamp: "10:12 AM",
        status: "delivered",
      },
    ],
    name: "Jakob Hoeg",
    isOnline: true,
    lastSeen: "Online",
  },
  {
    id: 2,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jackson",
    name: "Jackson Lee",
    messages: [],
    isOnline: false,
    lastSeen: "Last seen today at 9:00 AM",
  },
  {
    id: 3,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Isabella",
    name: "Isabella Nguyen",
    messages: [],
    isOnline: false,
    lastSeen: "Last seen yesterday at 8:30 PM",
  },
  {
    id: 4,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=William",
    name: "William Kim",
    messages: [],
    isOnline: true,
    lastSeen: "Online",
  },
];

export type UserData = (typeof userData)[number];

export const loggedInUserData = {
  id: 5,
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=LoggedIn",
  name: "Admin",
};

export type LoggedInUserData = typeof loggedInUserData;

export interface Message {
  id: number;
  avatar: string;
  name: string;
  message: string;
  timestamp?: string;
  status?: "sent" | "delivered" | "read";
}

export interface User {
  id: number;
  avatar: string;
  messages: Message[];
  name: string;
  isOnline: boolean;
  lastSeen: string;
}
