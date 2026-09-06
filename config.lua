-- ============================================================================
-- BUCU Radial Action Wheel — Configuration
-- ============================================================================

RadialConfig = {}

RadialConfig.Language = 'en'
RadialConfig.DefaultKey = 'F1' -- Keybind mapped via FiveM RegisterKeyMapping

-- Root Radial Categories
RadialConfig.Menu = {
    {
        id = 'vehicle',
        label = 'Vehicle Controls',
        icon = 'car',
        requiresVehicle = true,
        items = {
            { id = 'engine', label = 'Toggle Engine', icon = 'power-off', action = 'toggle_engine' },
            { id = 'hood', label = 'Hood (Kap Mesin)', icon = 'wrench', action = 'toggle_door', door = 4 },
            { id = 'trunk', label = 'Trunk (Bagasi)', icon = 'archive', action = 'toggle_door', door = 5 },
            { id = 'interior_light', label = 'Interior Light', icon = 'lightbulb', action = 'toggle_interior_light' },
            { id = 'door_fl', label = 'Front Left Door', icon = 'arrow-left', action = 'toggle_door', door = 0 },
            { id = 'door_fr', label = 'Front Right Door', icon = 'arrow-right', action = 'toggle_door', door = 1 }
        }
    },
    {
        id = 'clothes',
        label = 'Quick Clothing',
        icon = 'tshirt',
        items = {
            { id = 'hat', label = 'Toggle Hat', icon = 'hat-cowboy', action = 'toggle_prop', prop = 0 },
            { id = 'glasses', label = 'Toggle Glasses', icon = 'glasses', action = 'toggle_prop', prop = 1 },
            { id = 'mask', label = 'Toggle Mask', icon = 'mask', action = 'toggle_cloth', component = 1 },
            { id = 'jacket', label = 'Toggle Jacket', icon = 'vest', action = 'toggle_cloth', component = 11 },
            { id = 'vest', label = 'Toggle Armor Vest', icon = 'shield-alt', action = 'toggle_cloth', component = 9 },
            { id = 'bag', label = 'Toggle Backpack', icon = 'suitcase', action = 'toggle_cloth', component = 5 }
        }
    },
    {
        id = 'emotes',
        label = 'Actions & Emotes',
        icon = 'user-friends',
        items = {
            { id = 'cancel_anim', label = 'Cancel Animation', icon = 'hand-paper', action = 'cancel_anim' },
            { id = 'sit', label = 'Sit Down', icon = 'chair', action = 'play_anim', dict = 'anim@heists@fleeca_bank@ig_7_jetski_owner', anim = 'owner_idle' },
            { id = 'lean', label = 'Lean Wall', icon = 'child', action = 'play_anim', dict = 'amb@world_human_leaning@male@wall@back@foot_up@idle_a', anim = 'idle_a' },
            { id = 'surrender', label = 'Hands Up / Surrender', icon = 'hand-paper', action = 'play_anim', dict = 'random@arrests@busted', anim = 'idle_a' }
        }
    },
    {
        id = 'citizen',
        label = 'Citizen & General',
        icon = 'shield-alt',
        items = {
            { id = 'cancel_anim2', label = 'Cancel Animation', icon = 'hand-paper', action = 'cancel_anim' },
            { id = 'emergency', label = 'Call 911 Dispatch', icon = 'phone', action = 'call_911' }
        }
    }
}
