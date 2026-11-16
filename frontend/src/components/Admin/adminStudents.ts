import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";
import type { StudentResponse } from "../../types";

export function useAdminStudents(logMessage: (message: string) => void) {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setStudents(await adminApi.getStudents());
      setError(false);
    } catch (err) {
      setError(true);
      logMessage(
        `Error loading students: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoading(false);
    }
  }, [logMessage]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { students, loading, error, reload };
}
export const normalizeIdentifier = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, "");
export function identifierRows(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) =>
      line.split(/[,;\t]/).map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

export function isIdentifierHeader(value: string): boolean {
  const header = value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return [
    "taz",
    "id",
    "userid",
    "studentid",
    "email",
    "תז",
    "תעודתזהות",
    "מספרתעודתזהות",
    "מספרזהות",
    "מזהה",
    "דואל",
    "כתובתדואל",
  ].includes(header);
}
