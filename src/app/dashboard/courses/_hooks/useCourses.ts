"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { useTrack } from "@/hooks/useTrack";
import { logger } from "@/lib/logger";
import type { Course } from "@/types/course";
import {
  type CatalogFilters, type SortKey,
  DEFAULT_FILTERS, toMs,
} from "../_types/catalog";

interface UseCoursesCatalogReturn {
  courses: Course[];
  enrolledCourses: string[];
  ownCourseIds: Set<string>;
  creatorNames: Record<string, string>;
  institutionName: string;
  loading: boolean;
  loadError: string | null;
  search: string;
  setSearch: (v: string) => void;
  filters: CatalogFilters;
  setFilter: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
  accessible: Course[];
  locked: Course[];
  totalFiltered: number;
}

export function useCoursesCatalog(): UseCoursesCatalogReturn {
  const { user, institutionId, isTeacher } = useAuth();
  const { canAccessCourse } = useAccess();
  const { track } = useTrack();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [ownCourseIds, setOwnCourseIds] = useState<Set<string>>(new Set());
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoadError(null);

        let institutionTeacherIds: string[] = [];
        if (institutionId) {
          const [instSnap, membersSnap] = await Promise.all([
            getDoc(doc(db, "institutions", institutionId)),
            getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId))),
          ]);
          if (!cancelled && instSnap.exists()) setInstitutionName(instSnap.data().name ?? "");
          institutionTeacherIds = membersSnap.docs
            .filter(d => d.data().institutionRole === "teacher")
            .map(d => d.id);
        }

        const snap = await getDocs(query(
          collection(db, "courses"),
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        ));
        let all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));

        if (institutionId && institutionTeacherIds.length > 0) {
          all = all.filter(c => c.createdBy && institutionTeacherIds.includes(c.createdBy));
        }

        if (cancelled) return;
        setCourses(all);

        if (user && isTeacher) {
          const ownIds = new Set(all.filter(c => c.createdBy === user.uid).map(c => c.id!));
          if (!cancelled) setOwnCourseIds(ownIds);
        }

        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!cancelled && userDoc.exists()) {
            setEnrolledCourses(userDoc.data().enrolledCourses ?? []);
          }
        }

        const creatorIds = [...new Set(all.map(c => c.createdBy).filter(Boolean))] as string[];
        if (creatorIds.length > 0) {
          const nameMap: Record<string, string> = {};
          const chunks: string[][] = [];
          for (let i = 0; i < creatorIds.length; i += 30) chunks.push(creatorIds.slice(i, i + 30));
          await Promise.all(chunks.map(async chunk => {
            const usersSnap = await getDocs(query(collection(db, "users"), where("__name__", "in", chunk)));
            usersSnap.docs.forEach(d => { nameMap[d.id] = d.data().name ?? d.data().displayName ?? ""; });
          }));
          if (!cancelled) setCreatorNames(nameMap);
        }
      } catch (err) {
        logger.error("useCoursesCatalog: fetch failed", err);
        if (!cancelled) {
          setLoadError("Não foi possível carregar o catálogo. Confirma o índice composto no Firebase: status (asc) + createdAt (desc).");
          setCourses([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [user?.uid, institutionId, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      track("search_query", undefined, undefined, { queryText: search.trim() });
    }, 600);
    return () => clearTimeout(timer);
  }, [search, track]);

  const setFilter = useCallback(
    <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    }, []
  );

  const clearAll = useCallback(() => {
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setSort("recent");
  }, []);

  const hasActiveFilters = useMemo(
    () => search.trim() !== "" || filters.cat !== "all" ||
          filters.level !== "all" || filters.price !== "all" || filters.certificate !== null || sort !== "recent",
    [search, filters, sort]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = courses.filter(c => {
      if (filters.cat !== "all" && c.category !== filters.cat) return false;
      if (filters.level !== "all" && c.level !== filters.level) return false;
      if (filters.price === "free" && c.price > 0) return false;
      if (filters.price === "paid" && c.price === 0) return false;
      if (filters.certificate === true && !c.hasCertificate) return false;
      if (filters.certificate === false && c.hasCertificate) return false;
      if (q) {
        return c.title.toLowerCase().includes(q) ||
               (c.description?.toLowerCase().includes(q) ?? false) ||
               (c.tags?.some(t => t.toLowerCase().includes(q)) ?? false);
      }
      return true;
    });
    return [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":     return toMs(a.createdAt) - toMs(b.createdAt);
        case "az":         return a.title.localeCompare(b.title);
        case "za":         return b.title.localeCompare(a.title);
        case "price-asc":  return (a.price ?? 0) - (b.price ?? 0);
        case "price-desc": return (b.price ?? 0) - (a.price ?? 0);
        default:           return toMs(b.createdAt) - toMs(a.createdAt);
      }
    });
  }, [courses, filters, search, sort]);

  const accessible = useMemo(
    () => filtered.filter(c =>
      ownCourseIds.has(c.id!) ||
      canAccessCourse(c.id!, enrolledCourses, c.price, c.accessCode)
    ),
    [filtered, enrolledCourses, ownCourseIds, canAccessCourse]
  );

  const locked = useMemo(
    () => filtered.filter(c =>
      !ownCourseIds.has(c.id!) &&
      !canAccessCourse(c.id!, enrolledCourses, c.price, c.accessCode)
    ),
    [filtered, enrolledCourses, ownCourseIds, canAccessCourse]
  );

  return {
    courses, enrolledCourses, ownCourseIds, creatorNames, institutionName,
    loading, loadError, search, setSearch, filters, setFilter,
    sort, setSort, clearAll, hasActiveFilters, accessible, locked,
    totalFiltered: filtered.length,
  };
}
