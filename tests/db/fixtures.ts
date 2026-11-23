/**
 * Synthetic fixtures ONLY. No real family, child, school or account data (CLAUDE.md rule 10/13).
 * Scenario: one family with two guardians and two children (own logins, different schools),
 * a Patchwork guardian in a second household who is guardian of ONE child only, scoped grantees,
 * and a second, unrelated family.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// person ids (public.persons.id) and auth ids (auth.users.id) are deliberately different.
export const person = {
  ad1: id(1), ad2: id(2), ka: id(3), kb: id(4), pw: id(5),
  grSports: id(6), grTasksW: id(7), grExpired: id(8), grRevoked: id(9),
  outsider: id(10), c1: id(11), u1: id(12), kc: id(13)
} as const;
export const auth = {
  ad1: id(101), ad2: id(102), ka: id(103), kb: id(104), pw: id(105),
  grSports: id(106), grTasksW: id(107), grExpired: id(108), grRevoked: id(109),
  outsider: id(110), c1: id(111), u1: id(112),
  orphan: id(199) // authenticated JWT subject without a public.users row
} as const;
export type Actor = keyof typeof auth;
export const actorsWithPerson = ["ad1", "ad2", "ka", "kb", "pw", "grSports", "grTasksW", "grExpired", "grRevoked", "outsider", "c1", "u1"] as const;

export const family = { f1: id(201), f2: id(202) } as const;
export const household = { h1: id(211), h2: id(212), h3: id(213) } as const;
export const school = { s1: id(221), s2: id(222) } as const;
export const enrollment = { ka: id(231), kb: id(232) } as const;
export const subject = { ka: id(241), kb: id(242) } as const;
export const task = { ka: id(301), kb: id(302), kc: id(303) } as const;
export const exam = { ka: id(311), kb: id(312), kc: id(313) } as const;
export const project = { ka: id(321), kb: id(322) } as const;
export const step = { ka: id(331), kb: id(332) } as const;
export const studySession = { ka: id(341), kb: id(342) } as const;
export const proposal = { ka: id(351), kb: id(352), kc: id(353) } as const;
export const event = { ad1Private: id(361), ad2Private: id(362), kaShared: id(363), kaPrivate: id(364) } as const;
export const grant = { sports: id(371), tasksW: id(372), expired: id(373), revoked: id(374) } as const;
export const connection = { ad1: id(381) } as const;
