export function convertScore10ToLetter(score10) {
  if (score10 === null || score10 === undefined) return '';
  const score = Number(score10);
  if (isNaN(score) || score < 0 || score > 10) return '';
  if (score >= 8.5) return 'A';
  if (score >= 7.0) return 'B';
  if (score >= 5.5) return 'C';
  if (score >= 4.0) return 'D';
  return 'F';
}

export function convertLetterToScore4(letter) {
  if (!letter) return null;
  const l = letter.trim().toUpperCase();
  if (l === 'A') return 4.0;
  if (l === 'B') return 3.0;
  if (l === 'C') return 2.0;
  if (l === 'D') return 1.0;
  if (l === 'F') return 0.0;
  return null; // For I, X, R, etc.
}

export function calculateCumulativeGpa(courses) {
  if (!Array.isArray(courses) || courses.length === 0) return 0.00;
  
  const activeCourses = {};
  
  courses.forEach(c => {
    if (c.status === 'passed' || c.status === 'failed') {
      if (c.gradeLetter === 'I' || c.gradeLetter === 'X' || c.gradeLetter === 'R') {
        return;
      }
      
      const grade4 = c.score4 !== null && c.score4 !== undefined ? Number(c.score4) : 0.0;
      const key = c.code || c.name;
      
      if (!key) return;
      
      const existing = activeCourses[key];
      if (!existing || grade4 > existing.score4) {
        activeCourses[key] = { credits: Number(c.credits) || 0, score4: grade4 };
      }
    }
  });
  
  let totalWeighted = 0;
  let totalCredits = 0;
  Object.values(activeCourses).forEach(item => {
    totalWeighted += item.score4 * item.credits;
    totalCredits += item.credits;
  });
  
  return totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0.00;
}
