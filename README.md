<img src="./src/icon.svg" width="100" /><br>
# 2DWater
<i>Interactive 2D water for Sprites and Tiled Backgrounds with ripples, auto-waves, Physics splashes, buoyancy controls, and live surface queries.</i> <br>
### Version 0.2.1.0

[<img src="https://placehold.co/200x50/4493f8/FFF?text=Download&font=montserrat" width="200"/>](https://github.com/SalmanShhh/2dwater/releases/download/salmanshh_2dwater-0.2.1.0.c3addon/salmanshh_2dwater-0.2.1.0.c3addon)
<br>
<sub> [See all releases](https://github.com/SalmanShhh/2dwater/releases) </sub> <br>

---
<b><u>Author:</u></b> SalmanShh <br>
<sub>Made using [CAW](https://marketplace.visualstudio.com/items?itemName=skymen.caw) </sub><br>

## Table of Contents
- [Usage](#usage)
- [Examples Files](#examples-files)
- [Properties](#properties)
- [Actions](#actions)
- [Conditions](#conditions)
- [Expressions](#expressions)
---
## Usage
To build the addon, run the following commands:

```
npm i
npm run build
```

To run the dev server, run

```
npm i
npm run dev
```

## Examples Files

---
## Properties
| Property Name | Description | Type |
| --- | --- | --- |
| Tension | Spring stiffness pulling each column toward its rest height. Low values produce slow, wide waves. High values produce tight, fast ripples. | float |
| Dampening | Energy decay per tick. High values produce thick, viscous water. Low values allow long oscillation. | float |
| Spread | Lateral propagation rate between adjacent columns. Controls how fast a disturbance travels horizontally. | float |
| Mesh Columns | Number of simulation columns and mesh control points on the top row. Minimum 2, clamped at init. Can be changed at runtime via SetMeshColumns. | integer |
| Mesh Rows | Number of mesh rows. Only row 0 (the top edge) is deformed by the simulation. Minimum 2, clamped at init. | integer |
| Enable Auto-Waves | Continuously drives sinusoidal surface motion without any ApplyForce calls. When enabled, idle detection is bypassed. | check |
| Wave Length | Spatial wavelength of auto-waves in pixels. | integer |
| Period | Time in seconds for one full auto-wave cycle. Setting to 0 freezes phase accumulation. | float |
| Magnitude | Amplitude of auto-waves in pixels above the rest surface. | integer |
| Auto Physics Force | When enabled, automatically applies a splash impulse when a Physics-behavior instance overlaps the water object. | check |
| Physics Force Multiplier | Scales the impacting instance's velocityY to a force magnitude. | float |
| Physics Surface Radius | Horizontal splash radius in pixels for Physics auto-impacts. | integer |
| Idle Threshold | Maximum absolute column speed below which the simulation is considered at rest and ticking halts. 0 disables idle detection. | float |
| Spread Pass Count | Number of lateral spread iterations per tick. Min 1, max 16. Reduce for background water. | integer |


---
## Actions
| Action | Description | Params
| --- | --- | --- |
| Clear object-type force multiplier | Clears the Physics force multiplier for one object type. | Object type             *(string)* <br> |
| Clear object-type surface radius | Clears the Physics surface radius for one object type. | Object type             *(string)* <br> |
| Clear UID force multiplier | Clears the Physics force multiplier for one instance UID. | UID             *(number)* <br> |
| Clear UID surface radius | Clears the Physics surface radius for one instance UID. | UID             *(number)* <br> |
| Set object-type force multiplier | Sets the Physics force multiplier for one object type. | Object type name             *(string)* <br>Multiplier             *(number)* <br> |
| Set object-type surface radius | Sets the Physics surface radius for one object type. | Object type             *(string)* <br>Radius             *(number)* <br> |
| Set auto-force | Enables or disables automatic Physics impact detection. | Enabled             *(boolean)* <br> |
| Set Physics force multiplier | Sets the fallback velocity-to-force scale factor used when no object-type default or UID override is set. | Multiplier             *(number)* <br> |
| Set surface radius | Sets the base Physics surface radius. | Radius             *(number)* <br> |
| Set UID force multiplier | Sets the Physics force multiplier for one instance UID. | UID             *(number)* <br>Multiplier             *(number)* <br> |
| Set UID surface radius | Sets the Physics surface radius for one instance UID. | UID             *(number)* <br>Radius             *(number)* <br> |
| Set mesh columns | Changes the number of simulation columns at runtime. Wave state is resampled. Do not call every tick. | Columns             *(number)* <br> |
| Set mesh rows | Changes the number of mesh rows at runtime. Column simulation state is preserved. Do not call every tick. | Rows             *(number)* <br> |
| Set idle threshold | Sets the idle detection speed threshold at runtime. 0 disables idle detection. | Threshold             *(number)* <br> |
| Set spread pass count | Sets the number of spread pass iterations per tick. Clamped to [1, 16]. | Count             *(number)* <br> |
| Apply force | Applies a vertical impulse to the water surface at a world X coordinate. | X             *(number)* <br>Force             *(number)* <br>Radius             *(number)* <br> |
| Flatten surface | Immediately resets all water columns to the flat rest height and clears their velocity. |  |
| Flatten surface by percentage | Instantly moves the current surface toward flat by a percentage. 100 fully flattens it; 0 leaves it unchanged. | Percentage             *(number)* <br> |
| Set dampening | Sets the energy decay rate at runtime. | Dampening             *(number)* <br> |
| Set spread | Sets the lateral propagation rate at runtime. | Spread             *(number)* <br> |
| Set tension | Sets the spring constant at runtime. | Tension             *(number)* <br> |
| Set auto-waves enabled | Enables or disables auto-wave oscillation. | Enabled             *(boolean)* <br> |
| Set magnitude | Sets the auto-wave amplitude in pixels. | Magnitude             *(number)* <br> |
| Set period | Sets the auto-wave cycle duration in seconds. 0 freezes phase accumulation. | Period             *(number)* <br> |
| Set wave length | Sets the spatial wavelength of auto-waves in pixels. | Wave Length             *(number)* <br> |


---
## Conditions
| Condition | Description | Params
| --- | --- | --- |
| On Physics impact | Fires once per Physics instance per surface zone entry. Pass 0 to fire for any impacting instance. | Instance UID *(number)* <br> |
| Is auto-waves enabled | True if auto-wave oscillation is currently active. |  |
| Is idle | True if the simulation has stopped ticking due to idle detection. |  |
| Is Physics auto-force enabled | True if Physics auto-force detection is currently active. |  |


---
## Expressions
| Expression | Description | Return Type | Params
| --- | --- | --- | --- |
| ObjectTypePhysicsForceMultiplier | Physics force multiplier for the named object type. Falls back to the base water value if no object-type value is set. | number | Object type name *(string)* <br> | 
| ObjectTypePhysicsSurfaceRadius | Effective Physics surface radius for the named object type. Falls back to the water instance default when no object-type default is set. | number | Object type name *(string)* <br> | 
| UIDPhysicsForceMultiplier | Effective Physics force multiplier for the given UID using the hybrid order: UID override, object-type default, then water instance default. | number | UID *(number)* <br> | 
| UIDPhysicsSurfaceRadius | Effective Physics surface radius for the given UID using the hybrid order: UID override, object-type default, then water instance default. | number | UID *(number)* <br> | 
| ImpactForce | The computed force applied to the surface. Valid inside OnPhysicsImpact only. | number |  | 
| ImpactUID | UID of the impacting Physics instance. Valid inside OnPhysicsImpact only. | number |  | 
| ImpactX | World X coordinate of the Physics impact. Valid inside OnPhysicsImpact only. | number |  | 
| MeshColumns | Current number of simulation columns. | number |  | 
| MeshRows | Current number of mesh rows. | number |  | 
| AutoWaveEnabled | 1 if auto-waves are currently enabled, 0 if disabled. | number |  | 
| SurfaceNormal | Upward surface normal angle in radians for the water surface at world X position x. | number | X *(number)* <br> | 
| SurfaceNormalAngle | Upward surface normal angle in degrees from 0 to 360 for the water surface at world X position x. | number | X *(number)* <br> | 
| SurfaceY | World Y of the water surface at world X position x. | number | X *(number)* <br> | 


---
## Changelog

**0.2.1.0**

**0.2.0.0**
- **Added:** - Add Bouyancy System

**0.1.1.0**

**0.1.0.0**
- **Added:** initial test build

**0.0.0.0**
- **Added:** Initial release.
