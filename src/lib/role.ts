export type Role = "worker" | "packer" | "manager";

const KEY = "gerts-role";

export function getRole(): Role | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "worker" || v === "packer" || v === "manager" ? v : null;
  } catch {
    return null;
  }
}

export function setRole(r: Role) {
  try {
    localStorage.setItem(KEY, r);
  } catch {
    /* приватний режим */
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  worker: "Виробництво",
  packer: "Комплектація",
  manager: "Менеджер",
};
