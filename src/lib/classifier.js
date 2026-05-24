/**
 * DSCP Classifier Module
 *
 * Pure functions for DiffServ packet classification based on RFC 4594.
 * This module provides the core classification logic for the game.
 *
 * @module classifier
 */

/**
 * @typedef {Object} ServiceClass
 * @property {string} id - Class identifier (e.g., 'EF', 'AF11')
 * @property {string} name - Full class name
 * @property {string} category - Parent category (EF, AF, CS, BE)
 * @property {number} dscp - DSCP value (0-63)
 * @property {string} dscpBinary - 6-bit binary representation
 * @property {string} phbBehavior - Per-Hop Behavior description
 */

/**
 * @typedef {Object} ClassificationResult
 * @property {boolean} correct - Whether the classification was correct
 * @property {string} selectedClass - The class the player selected
 * @property {string} correctClass - The correct class for this traffic
 * @property {string} feedback - Feedback message
 */

/** @type {Map<string, ServiceClass>} */
let classesCache = null;

/** @type {Map<string, string>} */
let categoryLookup = null;

/**
 * Initialize the classifier with DSCP class data
 * @param {Object} dscpData - The dscp-classes.json data
 */
export function initClassifier(dscpData) {
  classesCache = new Map();
  categoryLookup = new Map();

  for (const cls of dscpData.classes) {
    classesCache.set(cls.id, cls);
    categoryLookup.set(cls.id, cls.category);
  }
}

/**
 * Check if the classifier has been initialized
 * @returns {boolean}
 */
export function isInitialized() {
  return classesCache !== null && classesCache.size > 0;
}

/**
 * Classify a player's selection against the correct answer
 * @param {string} selectedClass - The class ID selected by the player
 * @param {string} correctClass - The correct class ID for this traffic
 * @returns {ClassificationResult}
 */
export function classify(selectedClass, correctClass) {
  if (!isInitialized()) {
    throw new Error('Classifier not initialized. Call initClassifier first.');
  }

  const selected = classesCache.get(selectedClass);
  const correct = classesCache.get(correctClass);

  if (!selected) {
    throw new Error(`Unknown class: ${selectedClass}`);
  }

  if (!correct) {
    throw new Error(`Unknown correct class: ${correctClass}`);
  }

  const isCorrect = selectedClass === correctClass;

  return {
    correct: isCorrect,
    selectedClass,
    correctClass,
    feedback: isCorrect
      ? `Correct! ${correct.name} (DSCP ${correct.dscp}) is the right choice.`
      : `Incorrect. You selected ${selected.name}, but ${correct.name} (DSCP ${correct.dscp}) was the correct classification.`,
  };
}

/**
 * Get a service class by ID
 * @param {string} classId - The class ID (e.g., 'EF', 'AF11')
 * @returns {ServiceClass|undefined}
 */
export function getClass(classId) {
  if (!isInitialized()) {
    throw new Error('Classifier not initialized. Call initClassifier first.');
  }
  return classesCache.get(classId);
}

/**
 * Get all classes in a category
 * @param {string} category - The category (EF, AF, CS, BE)
 * @returns {ServiceClass[]}
 */
export function getClassesByCategory(category) {
  if (!isInitialized()) {
    throw new Error('Classifier not initialized. Call initClassifier first.');
  }

  const classes = [];
  for (const cls of classesCache.values()) {
    if (cls.category === category) {
      classes.push(cls);
    }
  }
  return classes;
}

/**
 * Get the category for a class
 * @param {string} classId - The class ID
 * @returns {string|undefined}
 */
export function getCategoryForClass(classId) {
  if (!isInitialized()) {
    throw new Error('Classifier not initialized. Call initClassifier first.');
  }
  return categoryLookup.get(classId);
}

/**
 * Convert DSCP value to binary string
 * @param {number} dscp - DSCP value (0-63)
 * @returns {string} 6-bit binary string
 */
export function dscpToBinary(dscp) {
  if (dscp < 0 || dscp > 63) {
    throw new Error(`DSCP value must be 0-63, got: ${dscp}`);
  }
  return dscp.toString(2).padStart(6, '0');
}

/**
 * Convert binary string to DSCP value
 * @param {string} binary - 6-bit binary string
 * @returns {number} DSCP value (0-63)
 */
export function binaryToDscp(binary) {
  if (!/^[01]{6}$/.test(binary)) {
    throw new Error(`Invalid binary string: ${binary}`);
  }
  return parseInt(binary, 2);
}

/**
 * Get all available classes
 * @returns {ServiceClass[]}
 */
export function getAllClasses() {
  if (!isInitialized()) {
    throw new Error('Classifier not initialized. Call initClassifier first.');
  }
  return Array.from(classesCache.values());
}

/**
 * Check if a class exists
 * @param {string} classId - The class ID to check
 * @returns {boolean}
 */
export function hasClass(classId) {
  if (!isInitialized()) {
    return false;
  }
  return classesCache.has(classId);
}

/**
 * Get the RFC reference for a class
 * @param {string} classId - The class ID
 * @returns {Object|undefined} RFC reference object
 */
export function getRfcReference(classId) {
  const cls = getClass(classId);
  return cls?.rfcReference;
}

/**
 * Validate that a class selection is allowed given unlocked categories
 * @param {string} classId - The class ID to check
 * @param {string[]} unlockedCategories - Array of unlocked category IDs
 * @returns {boolean}
 */
export function isClassUnlocked(classId, unlockedCategories) {
  const category = getCategoryForClass(classId);
  if (!category) {
    return false;
  }
  return unlockedCategories.includes(category);
}
