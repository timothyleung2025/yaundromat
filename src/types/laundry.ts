export type MachineStatus = "available" | "running" | "grace" | "move";
export type Machine = {
  id: string;
  kind: "washer" | "dryer";
  endsAt: number | null;
  owner?: "you" | "neighbor";
};
export type Activity = {
  readAt?: number;
  category?: "loads" | "watching";
  id: string;
  text: string;
  time: number;
  status?: MachineStatus;
  machineId?: string;
  location?: string;
  recipient: "you" | "neighbor";
};
