import type { Device } from "@/types";

import { request } from "./http";

export const listDevices = () => request<Device[]>("/devices");

export const unlinkDevice = (id: number) => request<void>(`/devices/${id}`, { method: "DELETE" });
