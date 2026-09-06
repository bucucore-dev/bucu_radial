-- ============================================================================
-- BUCU Radial Action Wheel — Client Main Logic
-- ============================================================================

local isRadialOpen = false
local toggledProps = {} -- [propId] = { wasHidden = bool, drawable = ..., texture = ... }
local toggledComponents = {} -- [componentId] = { wasHidden = bool, drawable = ..., texture = ... }

local function getLocale(key)
    local lang = RadialConfig.Language or 'en'
    local dict = RadialLocales[lang] or RadialLocales['en']
    return dict[key] or key
end

local function openRadial()
    local ped = PlayerPedId()
    if IsEntityDead(ped) then return end

    local veh = GetVehiclePedIsIn(ped, false)
    local inVeh = (veh ~= 0)
    local hp = GetEntityHealth(ped)
    local maxHp = GetEntityMaxHealth(ped)
    local hpPct = math.floor(math.max(0, math.min(100, ((hp - 100) / (maxHp - 100)) * 100)))
    local armour = GetPedArmour(ped)

    isRadialOpen = true
    SetNuiFocus(true, true)
    if SetNuiFocusKeepInput then
        SetNuiFocusKeepInput(true)
    end

    SendNUIMessage({
        action = "OPEN_RADIAL",
        menu = RadialConfig.Menu,
        inVehicle = inVeh,
        health = hpPct,
        armour = armour,
        lang = RadialConfig.Language or 'en'
    })
end

local function closeRadial()
    if not isRadialOpen then return end
    isRadialOpen = false
    SetNuiFocus(false, false)
    if SetNuiFocusKeepInput then
        SetNuiFocusKeepInput(false)
    end
    SendNUIMessage({ action = "CLOSE_RADIAL" })
end

-- Key Mapping (+radialmenu opens on press, -radialmenu closes on release)
RegisterCommand('+radialmenu', function()
    openRadial()
end, false)

RegisterCommand('-radialmenu', function()
    if isRadialOpen then
        SendNUIMessage({ action = "KEY_RELEASED" })
    end
end, false)

RegisterKeyMapping('+radialmenu', 'Open BUCU Quick Radial Wheel', 'keyboard', RadialConfig.DefaultKey or 'F1')

-- Keep Input Movement Handler when Radial is Open
CreateThread(function()
    while true do
        local sleep = 300
        if isRadialOpen then
            sleep = 0
            -- Disable camera looking around so mouse cursor can select radial slices cleanly
            DisableControlAction(0, 1, true)   -- Look Left/Right
            DisableControlAction(0, 2, true)   -- Look Up/Down
            DisableControlAction(0, 24, true)  -- Attack (Left Click)
            DisableControlAction(0, 25, true)  -- Aim (Right Click)
            DisableControlAction(0, 140, true) -- Melee Light
            DisableControlAction(0, 141, true) -- Melee Heavy
            DisableControlAction(0, 142, true) -- Melee Alternate
            DisableControlAction(0, 288, true) -- F1
        end
        Wait(sleep)
    end
end)

-- ============================================================================
-- NUI Callbacks
-- ============================================================================

RegisterNUICallback('close', function(_, cb)
    closeRadial()
    cb('ok')
end)

RegisterNUICallback('executeAction', function(data, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)

    if data.action == 'toggle_engine' then
        if veh ~= 0 then
            local isRunning = GetIsVehicleEngineRunning(veh)
            SetVehicleEngineOn(veh, not isRunning, false, true)
        end
    elseif data.action == 'toggle_door' and data.door ~= nil then
        if veh ~= 0 then
            local door = tonumber(data.door)
            if GetVehicleDoorAngleRatio(veh, door) > 0.1 then
                SetVehicleDoorShut(veh, door, false)
            else
                SetVehicleDoorOpen(veh, door, false, false)
            end
        end
    elseif data.action == 'toggle_interior_light' then
        if veh ~= 0 then
            SetVehicleInteriorlight(veh, true)
        end
    elseif data.action == 'toggle_prop' and data.prop ~= nil then
        local propIndex = tonumber(data.prop)
        local curDrawable = GetPedPropIndex(ped, propIndex)
        if curDrawable == -1 then
            -- Restore previous
            if toggledProps[propIndex] then
                SetPedPropIndex(ped, propIndex, toggledProps[propIndex].drawable, toggledProps[propIndex].texture, true)
                toggledProps[propIndex] = nil
            end
        else
            -- Store and clear
            toggledProps[propIndex] = {
                drawable = curDrawable,
                texture = GetPedPropTextureIndex(ped, propIndex)
            }
            ClearPedProp(ped, propIndex)
        end
    elseif data.action == 'toggle_cloth' and data.component ~= nil then
        local compIndex = tonumber(data.component)
        local curDrawable = GetPedDrawableVariation(ped, compIndex)
        if toggledComponents[compIndex] then
            -- Restore
            SetPedComponentVariation(ped, compIndex, toggledComponents[compIndex].drawable, toggledComponents[compIndex].texture, 0)
            toggledComponents[compIndex] = nil
        else
            -- Hide / default
            toggledComponents[compIndex] = {
                drawable = curDrawable,
                texture = GetPedTextureVariation(ped, compIndex)
            }
            local cleanVal = (compIndex == 11) and 15 or ((compIndex == 9 or compIndex == 5) and 0 or 0)
            SetPedComponentVariation(ped, compIndex, cleanVal, 0, 0)
        end
    elseif data.action == 'play_anim' and data.dict and data.anim then
        RequestAnimDict(data.dict)
        local timeout = 0
        while not HasAnimDictLoaded(data.dict) and timeout < 30 do
            Wait(50)
            timeout = timeout + 1
        end
        if HasAnimDictLoaded(data.dict) then
            TaskPlayAnim(ped, data.dict, data.anim, 8.0, -8.0, -1, 49, 0, false, false, false)
        end
    elseif data.action == 'cancel_anim' then
        ClearPedTasks(ped)
    elseif data.action == 'call_911' then
        if exports and exports.bucu_notify and exports.bucu_notify.Notify then
            exports.bucu_notify:Notify("Emergency call transmitted to Police & EMS Dispatch.", "warning", 5000)
        end
    end

    closeRadial()
    cb('ok')
end)

-- ============================================================================
-- Public Exports
-- ============================================================================

exports('Open', openRadial)
exports('Close', closeRadial)
