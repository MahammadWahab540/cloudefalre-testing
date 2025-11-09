
export interface TranscriptionEntry {
  id: string;
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

export interface Session {
  id: string;
  userName: string;
  userNumber: string;
  startTime: Date;
  endTime: Date;
  transcription: TranscriptionEntry[];
}
