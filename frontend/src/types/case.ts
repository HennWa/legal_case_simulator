export interface ActorPayload {
  name: string;
  role: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  profession: string;
  background: string;
}

export interface CreateCasePayload {
  owner_id: string;
  title: string;
  applied_law: string;
  description: string;
  legal_issue: string;
  deadlines: string;
  status_date: string;
  legal_initiation_date: string;
  language: string;
  actors: ActorPayload[];
}