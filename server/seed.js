const bcrypt = require('bcryptjs');
const { sequelize, User, Question, Exam, ExamQuestion, ExamSession, ViolationLog, AuditLog } = require('./models');

async function seedDatabase() {
  await sequelize.sync({ force: true });
  console.log('[Seed] Database schema synchronized.');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const studentPassHash = await bcrypt.hash('student123', 10);
  const proctorPassHash = await bcrypt.hash('proctor123', 10);

  const admin = await User.create({
    username: 'admin',
    email: 'admin@aegisexam.io',
    passwordHash: passwordHash,
    role: 'admin',
    fullName: 'Dr. Eleanor Vance',
    department: 'Computer Science & Cryptography'
  });

  const student = await User.create({
    username: 'sarah_jenkins',
    email: 'student@aegisexam.io',
    passwordHash: studentPassHash,
    role: 'student',
    fullName: 'Sarah Jenkins',
    studentId: 'MIT-2026-CS8891',
    department: 'Computer Science'
  });

  const student2 = await User.create({
    username: 'alex_rivera',
    email: 'alex@aegisexam.io',
    passwordHash: studentPassHash,
    role: 'student',
    fullName: 'Alex Rivera',
    studentId: 'MIT-2026-CS8892',
    department: 'Electrical Engineering & CS'
  });

  const student3 = await User.create({
    username: 'david_chen',
    email: 'david@aegisexam.io',
    passwordHash: studentPassHash,
    role: 'student',
    fullName: 'David Chen',
    studentId: 'MIT-2026-CS8893',
    department: 'Information Security'
  });

  const invigilator = await User.create({
    username: 'proctor_marcus',
    email: 'proctor@aegisexam.io',
    passwordHash: proctorPassHash,
    role: 'invigilator',
    fullName: 'Officer Marcus Ray',
    department: 'Academic Integrity & Security'
  });

  console.log('[Seed] Users created: Admin, Students, Invigilator.');

  // 2. Seed Questions
  const q1 = await Question.create({
    title: 'Two Sum & Target Index Hash',
    subject: 'CS 401: Advanced Cryptography & Distributed Systems',
    module: 'Module 1: Algorithmic Foundations',
    type: 'coding',
    difficulty: 'easy',
    marks: 20,
    negativeMarks: 0,
    timeLimitMinutes: 15,
    problemStatement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order (indices 0-based).`,
    starterCode: JSON.stringify({
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def two_sum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (seen.count(diff)) return {seen[diff], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
      java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`
    }),
    inputFormat: 'Line 1: Comma-separated array of integers. Line 2: Single integer target.',
    outputFormat: 'Array of two indices [i, j].',
    constraints: `* 2 <= nums.length <= 10^4
* -10^9 <= nums[i] <= 10^9
* -10^9 <= target <= 10^9
* Only one valid answer exists.`,
    sampleTestCases: JSON.stringify([
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', explanation: 'nums[1] + nums[2] == 2 + 4 == 6.' },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]', explanation: 'nums[0] + nums[1] == 3 + 3 == 6.' }
    ]),
    privateTestCases: JSON.stringify([
      { input: '[1, 5, 8, 3, 9], 14', expectedOutput: '[1, 4]' },
      { input: '[-3, 4, 3, 90], 0', expectedOutput: '[0, 2]' },
      { input: '[11, 15, 2, 7], 9', expectedOutput: '[2, 3]' }
    ]),
    supportedLanguages: JSON.stringify(['javascript', 'python', 'cpp', 'java']),
    status: 'published',
    createdBy: admin.id
  });

  const q2 = await Question.create({
    title: 'Topological Course Schedule & Cycle Detection',
    subject: 'CS 401: Advanced Cryptography & Distributed Systems',
    module: 'Module 2: Graph Theory & Proof of Execution',
    type: 'coding',
    difficulty: 'medium',
    marks: 30,
    negativeMarks: 0,
    timeLimitMinutes: 20,
    problemStatement: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\` (i.e. if the dependency graph contains a cycle).`,
    starterCode: JSON.stringify({
      javascript: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
function canFinish(numCourses, prerequisites) {
  const inDegree = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);
  
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }
  
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  
  let count = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    count++;
    for (const neighbor of adj[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  
  return count === numCourses;
}`,
      python: `def can_finish(num_courses, prerequisites):
    from collections import deque, defaultdict
    in_degree = [0] * num_courses
    adj = defaultdict(list)
    for course, pre in prerequisites:
        adj[pre].append(course)
        in_degree[course] += 1
    queue = deque([i for i in range(num_courses) if in_degree[i] == 0])
    count = 0
    while queue:
        node = queue.popleft()
        count += 1
        for nxt in adj[node]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)
    return count == num_courses`,
      cpp: `#include <vector>
#include <queue>
using namespace std;

bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
    vector<int> inDegree(numCourses, 0);
    vector<vector<int>> adj(numCourses);
    for (auto& p : prerequisites) {
        adj[p[1]].push_back(p[0]);
        inDegree[p[0]]++;
    }
    queue<int> q;
    for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.push(i);
    int count = 0;
    while (!q.empty()) {
        int curr = q.front(); q.pop();
        count++;
        for (int nxt : adj[curr]) {
            if (--inDegree[nxt] == 0) q.push(nxt);
        }
    }
    return count == numCourses;
}`,
      java: `import java.util.*;

class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        int[] inDegree = new int[numCourses];
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            inDegree[p[0]]++;
        }
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.add(i);
        int count = 0;
        while (!q.isEmpty()) {
            int node = q.poll();
            count++;
            for (int nxt : adj.get(node)) {
                if (--inDegree[nxt] == 0) q.add(nxt);
            }
        }
        return count == numCourses;
    }
}`
    }),
    inputFormat: 'numCourses (integer), prerequisites (2D integer array).',
    outputFormat: 'Boolean (true or false).',
    constraints: `* 1 <= numCourses <= 2000
* 0 <= prerequisites.length <= 5000
* All prerequisite pairs [ai, bi] are unique.`,
    sampleTestCases: JSON.stringify([
      { input: '2, [[1, 0]]', expectedOutput: 'true', explanation: 'Course 0 must be taken before course 1. No cycle.' },
      { input: '2, [[1, 0], [0, 1]]', expectedOutput: 'false', explanation: 'Direct cycle: course 1 requires 0, and course 0 requires 1.' }
    ]),
    privateTestCases: JSON.stringify([
      { input: '4, [[1, 0], [2, 0], [3, 1], [3, 2]]', expectedOutput: 'true' },
      { input: '3, [[0, 1], [1, 2], [2, 0]]', expectedOutput: 'false' },
      { input: '3, [[1, 0], [2, 1]]', expectedOutput: 'true' }
    ]),
    supportedLanguages: JSON.stringify(['javascript', 'python', 'cpp', 'java']),
    status: 'published',
    createdBy: admin.id
  });

  const q3 = await Question.create({
    title: 'Zero-Knowledge SNARK Proof Constraint System',
    subject: 'CS 401: Advanced Cryptography & Distributed Systems',
    module: 'Module 3: Zero Knowledge Proofs',
    type: 'mcq',
    difficulty: 'hard',
    marks: 25,
    negativeMarks: 5,
    timeLimitMinutes: 10,
    problemStatement: `Given an arithmetic circuit over a finite field Fp, compute the QAP (Quadratic Arithmetic Program) polynomial constraint system. 

Specifically, explain why the prover cannot forge a witness polynomial without knowing the secret assignment vector w, and how the trusted setup toxic waste (tau) is nullified using powers of tau ceremonies.`,
    options: JSON.stringify([
      'The Schwartz-Zippel lemma bounds the probability of random evaluation collisions to negligible levels.',
      'By encrypting the polynomial evaluation inside an RSA accumulator.',
      'Via symmetric AES-256 GCM authenticated authentication tags.',
      'Using discrete log hardness with bilinear pairing groups G1, G2, GT.'
    ]),
    correctAnswer: 'The Schwartz-Zippel lemma bounds the probability of random evaluation collisions to negligible levels.',
    sampleTestCases: '[]',
    privateTestCases: '[]',
    supportedLanguages: '[]',
    status: 'published',
    createdBy: admin.id
  });

  const q4 = await Question.create({
    title: 'Timing Attack Mitigation in Constant-Time MAC Verification',
    subject: 'CS 401: Advanced Cryptography & Distributed Systems',
    module: 'Module 4: Side-Channel Cryptanalysis',
    type: 'descriptive',
    difficulty: 'medium',
    marks: 25,
    negativeMarks: 0,
    timeLimitMinutes: 15,
    problemStatement: `Explain how standard byte-by-byte memory comparison (such as \`memcmp\` or standard string \`==\`) introduces a side-channel timing vulnerability during HMAC verification.

Specifically:
1. Explain how an adversary can measure network latency or execution duration to sequentially guess message authentication codes byte by byte.
2. Provide a constant-time comparison algorithm (e.g. \`crypto.timingSafeEqual\`) that accumulates differences via bitwise OR without branching or early return.`,
    sampleTestCases: '[]',
    privateTestCases: '[]',
    supportedLanguages: '[]',
    status: 'published',
    createdBy: admin.id
  });

  console.log('[Seed] 4 Questions created (Coding, MCQ, Descriptive).');

  // 3. Seed Exam
  const exam = await Exam.create({
    title: 'CS 401: Advanced Cryptography & Distributed Systems — Final Examination',
    subject: 'CS 401: Advanced Cryptography',
    code: 'EXAM-FINAL-OCT26',
    durationMinutes: 45,
    totalMarks: 100,
    passingMarks: 40,
    watermarkStrategy: 'canvas-bake',
    watermarkOpacity: 0.18,
    watermarkAngle: -28,
    shuffleQuestions: false,
    allowCodeExecution: true,
    maxViolationsAllowed: 5,
    status: 'active',
    instructions: 'This is a strictly proctored examination. Screenshot keys, DevTools, focus loss, and window switches are actively deterred, blacked out, and logged to the proctor audit stream.',
    createdBy: admin.id
  });

  // Link questions to exam
  await ExamQuestion.create({ examId: exam.id, questionId: q1.id, orderIndex: 0, allocatedMarks: 20 });
  await ExamQuestion.create({ examId: exam.id, questionId: q2.id, orderIndex: 1, allocatedMarks: 30 });
  await ExamQuestion.create({ examId: exam.id, questionId: q3.id, orderIndex: 2, allocatedMarks: 25 });
  await ExamQuestion.create({ examId: exam.id, questionId: q4.id, orderIndex: 3, allocatedMarks: 25 });

  console.log('[Seed] Exam created and linked to questions.');

  // 4. Seed ExamSession for Sarah Jenkins
  const session = await ExamSession.create({
    examId: exam.id,
    userId: student.id,
    sessionToken: '9F8A2C1D',
    status: 'in_progress',
    startTime: new Date(Date.now() - 15 * 60 * 1000), // started 15 min ago
    candidateIp: '192.168.1.142',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) Chrome/123.0.0.0 Safari/537.36',
    violationCount: 1,
    currentQuestionIndex: 0,
    lastHeartbeat: new Date(),
    answers: JSON.stringify({
      [q1.id]: {
        code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}`,
        language: 'javascript',
        status: 'solved'
      },
      [q3.id]: {
        answer: 'The Schwartz-Zippel lemma bounds the probability of random evaluation collisions to negligible levels.'
      }
    })
  });

  // Additional session for Alex Rivera
  await ExamSession.create({
    examId: exam.id,
    userId: student2.id,
    sessionToken: '7B3E91A4',
    status: 'in_progress',
    startTime: new Date(Date.now() - 10 * 60 * 1000),
    candidateIp: '192.168.1.189',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    violationCount: 0,
    currentQuestionIndex: 1,
    lastHeartbeat: new Date()
  });

  // Additional session for David Chen
  await ExamSession.create({
    examId: exam.id,
    userId: student3.id,
    sessionToken: '4C82D7F0',
    status: 'in_progress',
    startTime: new Date(Date.now() - 25 * 60 * 1000),
    candidateIp: '10.0.4.55',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/125.0',
    violationCount: 2,
    currentQuestionIndex: 2,
    lastHeartbeat: new Date()
  });

  // 5. Seed Initial Violation Logs for realism
  await ViolationLog.create({
    sessionId: session.id,
    examId: exam.id,
    userId: student.id,
    candidateName: 'Sarah Jenkins',
    studentId: 'MIT-2026-CS8891',
    violationType: 'Focus Loss / Snipping Tool Pre-empted',
    severity: 'warning',
    details: 'Window blurred when OS shortcut was pressed; targeted question canvas obscured for 1.8s.',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    reviewed: false
  });

  await ViolationLog.create({
    sessionId: session.id,
    examId: exam.id,
    userId: student.id,
    candidateName: 'Sarah Jenkins',
    studentId: 'MIT-2026-CS8891',
    violationType: 'PrintScreen Key Intercepted',
    severity: 'critical',
    details: 'Hardware PrintScreen key (KeyCode 44) captured in capturing phase; clipboard flushed to security notice.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    reviewed: false
  });

  // 6. Seed Audit Log
  await AuditLog.create({
    userId: admin.id,
    role: 'admin',
    action: 'CREATE_EXAM',
    resourceType: 'Exam',
    resourceId: `${exam.id}`,
    details: 'Configured CS 401 Final with 4 questions and Canvas-Bake watermark policy.',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  });

  console.log('[Seed] Database initialization complete!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed executed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
