# Prompt B Input Labels

Date: 2026-04-02

- Prompt B no longer concatenates Prompt A output and the original seed input without labels.
- The prompt now separates them into `[Prompt A World Backbone]` and `[Original User Seed]`.
- The world backbone is treated as the primary canonical context.
- The original seed is a secondary recovery source for named entities that may have been omitted from Prompt A.
- Legacy saved Prompt B snapshots are regenerated on the page if they do not include the labeled block format.
