# starforce calculator

This is a fork of [acyr0/starforce_kms](https://github.com/acyr0/starforce_kms),
an analytical starforce calculator for post-Savior starforce costs.

# Key Changes

This fork is tailored to MapleSEA Star Force systems.

### 2026-01-31

- Implement Shining Star Force event (30% off + -30% boom ≤21), since only one event selection is allowed
- Implement 1+1 event

### 2026-01-16

- Implement Guardian Star Force event (30% off + -40% boom ≤21 + -20% boom ≤24)
  - For simplicity, only one event selection is allowed (30% off or -30% boom or GSF)
- Rename MVP tiers to fit [MapleSEA VIP system](https://www.maplesea.com/updates/view/v244_VIP/)
  - Gold: 3%
  - Diamond: 5%
  - Royal and above: 10%
- Adjust meso cost under 15 stars to non-GMS (MSEA/KMS) values
  - Formula for 0-15 assumed to remain unchanged from [here](https://strategywiki.org/wiki/MapleStory/Spell_Trace_and_Star_Force#Meso_Cost)
