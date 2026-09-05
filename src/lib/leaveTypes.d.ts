export type LeaveRequestLike = {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  activeStartDate?: string;
  activeEndDate?: string;
  days?: number;
};

export type EmployeeLeaveProfile = {
  leaveRequests?: LeaveRequestLike[];
};

export function isOnApprovedLeave(
  employee: EmployeeLeaveProfile | null | undefined,
  date?: Date | string,
): boolean;

export function isOnLeaveToday(employee: EmployeeLeaveProfile | null | undefined): boolean;

export function leaveTypeLabel(type: string | undefined, ar?: boolean): string;
