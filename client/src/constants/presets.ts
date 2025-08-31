export interface PresetScenario {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const SCENARIO_PRESETS = {
  student: [
    {
      key: 'cafeteria',
      title: 'School Cafeteria',
      description: 'Ordering lunch and chatting with friends in Japanese',
      icon: 'fas fa-utensils'
    },
    {
      key: 'club',
      title: 'Club Activity',
      description: 'Joining and participating in school clubs in Japanese',
      icon: 'fas fa-users'
    },
    {
      key: 'homework',
      title: 'Homework Help',
      description: 'Getting help with assignments in Japanese',
      icon: 'fas fa-book'
    },
    {
      key: 'school_trip',
      title: 'School Trip',
      description: 'Planning and discussing field trips in Japanese',
      icon: 'fas fa-map-marked-alt'
    },
    {
      key: 'new_friend',
      title: 'Making New Friends',
      description: 'Introducing yourself to new classmates in Japanese',
      icon: 'fas fa-handshake'
    },
    {
      key: 'confidence_talk',
      title: 'Confidence Building',
      description: 'Overcoming shyness and speaking up in Japanese',
      icon: 'fas fa-heart'
    }
  ],
  general: [
    {
      key: 'travel',
      title: 'Travel Conversations',
      description: 'Booking hotels and asking for directions in Japanese',
      icon: 'fas fa-plane'
    },
    {
      key: 'cafe_order',
      title: 'Café Orders',
      description: 'Ordering coffee and casual conversations in Japanese',
      icon: 'fas fa-coffee'
    },
    {
      key: 'job_interview',
      title: 'Job Interview (Basic)',
      description: 'Entry-level interview preparation in Japanese',
      icon: 'fas fa-briefcase'
    },
    {
      key: 'roommate_chat',
      title: 'Roommate Chat',
      description: 'Daily conversations with roommates in Japanese',
      icon: 'fas fa-home'
    },
    {
      key: 'hobby_club',
      title: 'Hobby Club',
      description: 'Discussing interests and joining activities in Japanese',
      icon: 'fas fa-palette'
    },
    {
      key: 'presentation_basics',
      title: 'Presentation Basics',
      description: 'Simple presentations and Q&A in Japanese',
      icon: 'fas fa-presentation'
    }
  ],
  business: [
    {
      key: 'email_etiquette',
      title: 'Email Etiquette',
      description: 'Professional email communication in Japanese',
      icon: 'fas fa-envelope'
    },
    {
      key: 'meeting_opener',
      title: 'Meeting Openers',
      description: 'Starting meetings and introductions in Japanese',
      icon: 'fas fa-handshake'
    },
    {
      key: 'negotiation_basics',
      title: 'Negotiation Basics',
      description: 'Basic negotiation techniques in Japanese',
      icon: 'fas fa-chart-line'
    },
    {
      key: 'small_talk',
      title: 'Professional Small Talk',
      description: 'Networking and casual conversations in Japanese',
      icon: 'fas fa-comments'
    },
    {
      key: 'deadline_followup',
      title: 'Deadline Follow-up',
      description: 'Managing deadlines and project updates in Japanese',
      icon: 'fas fa-clock'
    },
    {
      key: 'presentation_qa',
      title: 'Presentation Q&A',
      description: 'Handling questions after presentations in Japanese',
      icon: 'fas fa-question-circle'
    }
  ]
} as const;

export const VOICE_OPTIONS = [
  { id: 'female_friendly', name: 'Female - Friendly', gender: 'female' },
  { id: 'male_calm', name: 'Male - Calm', gender: 'male' },
  { id: 'business_formal', name: 'Business - Formal', gender: 'neutral' },
  { id: 'female_cheerful', name: 'Female - Cheerful', gender: 'female' },
] as const;

export const AUDIENCE_THEMES = {
  student: {
    name: 'Middle/High School',
    colors: {
      primary: 'student-primary',
      background: 'gradient-bg-student',
      card: 'student-pink',
    },
    cefr: 'A2-B1'
  },
  general: {
    name: 'College/General',
    colors: {
      primary: 'general-primary',
      background: 'gradient-bg-general',
      card: 'general-beige',
    },
    cefr: 'B1-B2'
  },
  business: {
    name: 'Business',
    colors: {
      primary: 'business-primary',
      background: 'gradient-bg-business',
      card: 'business-pale',
    },
    cefr: 'B2-C1'
  }
} as const;
