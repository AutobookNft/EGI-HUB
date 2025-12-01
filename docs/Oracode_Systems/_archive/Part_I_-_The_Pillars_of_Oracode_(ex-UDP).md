# Part I – The Pillars of Oracode (ex-UDP)

Oracode inherits the foundational structure of the Ultra Documentation Philosophy (UDP), refined through the lens of AChaos. These seven pillars define the semantic, temporal, and interpretive behavior of every fragment of code we produce.

## 1. Explicitly Intentional
Every line of code must express its purpose, not just its function. Intention precedes implementation.

## 2. Semantically Coherent
Names, structures, and concepts should resonate within the same semantic domain. Coherence makes code interpretable by intuition.

## 3. Contextually Autonomous
Each unit (class, method, trait, test) should hold meaning even when read in isolation.

## 4. Interpretable
Documentation, comments, and naming must act as portals — allowing future readers (or AIs) to reconstruct the mental model.

## 5. Variation-Ready
Code should anticipate future change and express that readiness through structure and naming.

## 6. Interrogable
A well-formed fragment can answer: “Who are you?”, “Why do you exist?”, “What would break you?”

## 7. Imperfect-Transmission Tolerant
Documentation must survive distortion, truncation, and partial transmission — like a myth passed down through centuries.

## 8. Linguistically Universal
All documentation, comments, and test narratives must be written in English.
English is the de facto semantic bridge for tooling, AI interpretation, and future interoperability.
### Consistency of Semantic Context
Semantic contexts within a codebase must maintain internal consistency. This applies not only to naming conventions but also to docblock structure and natural language choice.
### Rules of Semantic Consistency:

1. **Single Source of Truth**: Each semantic unit (method, class, test) should have one canonical description that fully defines its purpose.
2. **Pattern Recognition**: Similar components should follow predictable documentation patterns, allowing pattern recognition by both human and AI interpreters.
3. **Contextual Signatures**: Establish unique "signatures" for different test types (e.g., "⛓️ Oracular Behavior" for failure path tests) and maintain these signatures consistently.
4. **Localized Semantics**: Each docblock should be contextually autonomous, containing all necessary information to understand the component's purpose without referring to other docblocks.
5. **Cross-language Fragmentation Prohibition**: Never mix languages within semantic units. A docblock in English must remain entirely in English, even when developers communicate in other languages.

These guidelines ensure that code not only functions correctly today but speaks clearly to future maintainers, preserving intent and purpose even as systems evolve.