// Node only: load the calculator library. The scripts attach their functions to globalThis, so a plain
// require is enough. Keep this list in the same order as the <script> tags in amplifier_design_wizard.html.
require('./scripts/complex_num_utils.js');
require('./scripts/calcs_for_source_TL_load_setup.js');
require('./scripts/calcs_general_s_param_based_two_port_device.js');
require('./scripts/calcs_for_two_port_with_three_pi_shaped_as_two_port_device.js');
require('./scripts/convert_between_impedances_and_RLC_comps.js');
require('./scripts/find_voltage_across_load_helper.js');
require('./scripts/get_TL_params_from_RLC_constants.js');
require('./scripts/get_s_params_from_simulated_circuit.js');
require('./scripts/impedance_matching_for_source_TL_load_setup.js');
require('./scripts/impedance_matching_general_s_param_based_two_port_device.js');

globalThis.frequency = Math.pow(10, 8);
globalThis.load_impedance = {
	real: 75,
	imag: -25
}
globalThis.generator = {
	generator_distance: 1,
	generator_tl1_length: 0.6,
	generator_tl2_length: 0.4,
	generator_voltage_real: 1, 
	generator_voltage_imag: 0, 
	generator_impedance_real: 50, 
	generator_impedance_imag: 0
}
globalThis.two_port_z_parallel_pre_series = {
	real: 100,
	imag: -50
}
globalThis.two_port_z_series = {
	real: 100,
	imag: 0
}
globalThis.two_port_z_parallel_post_series = {
	real: 50,
	imag: 100
}

// getTLWaveParams(1, 167e-9, 0, 172e-12, Math.pow(10, 9));
globalThis.tlWaveParams = getTLWaveParams(0 /* R */, 250e-9 /* L */, 0 /* G */, 100e-12 /* C */, frequency);
const reflectionParams = getTLRefelectionCoefficient(load_impedance.real, load_impedance.imag, tlWaveParams.z0_magnitude, tlWaveParams.z0_theta);
const standingWaveRatio = getStandingWaveRatio_lossless_TL(reflectionParams.reflection);
const derived_impedance_at_load = getImpedanceAtDistanceFromLoad_lossless_TL(0, reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta);
if (Math.abs(derived_impedance_at_load.real - load_impedance.real) < 1e-4 && Math.abs(derived_impedance_at_load.imag - load_impedance.imag) < 1e-4) {
	console.log('derived impedance at load matched set load impedance value');
}
const v0plus = get_generator_related_values_lossless_TL(
	generator.generator_distance,
	generator.generator_voltage_real,
	generator.generator_voltage_imag,
	generator.generator_impedance_real,
	generator.generator_impedance_imag,
	reflectionParams.reflection, 
	tlWaveParams.z0_magnitude, 
	tlWaveParams.beta
);
const constant_swr_circle = get_swr_circle_lossless_TL(reflectionParams.reflection, v0plus, standingWaveRatio, tlWaveParams.z0_magnitude, tlWaveParams.beta);

match_real_impedance_by_quarter_wave_length_lossless_TL(tlWaveParams.z0_magnitude /* same as z0_real */, 800e-9 /* L */, frequency);

match_impedance_by_quarter_wave_length_plus_reactance_cancelling_segment_lossless_TL(
	reflectionParams.reflection, 
	tlWaveParams.z0_magnitude /* same as z0_real */, 
	tlWaveParams.beta,
	800e-9 /* L */,
	frequency
);

match_impedance_by_series_reactive_element_lossless_TL(reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta, frequency);

match_impedance_by_shunt_reactive_element_lossless_TL(reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta, frequency);

const thevenin_equivalent = find_thevenin_equivalent_circuit(generator, reflectionParams.reflection, tlWaveParams.z0_magnitude, tlWaveParams.beta);

const S_params = find_S_params(
	generator,
	two_port_z_parallel_pre_series, 
	two_port_z_series, 
	two_port_z_parallel_post_series,
	tlWaveParams.z0_magnitude, 
	tlWaveParams.beta
);

/*
 	-- New section --
 	Now that it is known how to obtain S params from a two-port network between a source and a load,
 	any given set of S params can be used without it feeling like hand waving the details.
*/

frequency = Math.pow(10, 8);
generator = {
	generator_distance: 1,
	generator_tl1_length: 0.5,
	generator_tl2_length: 0.5,
	generator_voltage_real: 0.001, 
	generator_voltage_imag: 0, 
	generator_impedance_real: 50, 
	generator_impedance_imag: 0
}
load_impedance = {
	real: 50,
	imag: 0
}
globalThis.S11 = {
    real: 0.225000,
    imag: -0.389711
};
globalThis.S21 = {
    real: 0.855050,
    imag: 2.349232
};
globalThis.S12 = {
    real: 0.046985,
    imag: 0.017101
};
globalThis.S22 = {
    real: 0.303109,
    imag: -0.175000
};

let signalFlowVals = findSignalFlowNodeValues(
	generator,
	load_impedance,
	S11,
	S21,
	S12,
	S22,
	tlWaveParams.z0_magnitude,
	tlWaveParams.beta
);
// console.log(signalFlowVals);

get_generator_and_load_thevenin_circuit_components(generator, load_impedance, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);

globalThis.V1 = { real: -2.4651624e-4, imag: -4.0180555e-4 };
globalThis.I1 = { real:  4.9686111e-6, imag: -1.1948075e-5 };
globalThis.generator_side_sim_vals = {
	voltage: V1,
	current: I1
};

globalThis.V2 = { real:  1.4592868e-3, imag:  4.6964979e-4 };
globalThis.I2 = { real: -2.9146574e-5, imag: -9.4815455e-6 };
globalThis.load_side_sim_vals = {
	voltage: V2,
	current: I2
};

const s_params_gen_side = get_s_params_from_simulated_circuit(generator_side_sim_vals, load_side_sim_vals, tlWaveParams.z0_magnitude);
S11 = s_params_gen_side.S11;
S21 = s_params_gen_side.S21;

globalThis.V1 = { real: 1.1513372e-5, imag: -3.1736097e-5 };
globalThis.I1 = { real: -2.3229474e-7, imag:  6.3408930e-7 };
globalThis.load_side_sim_vals_reverse_setup = {
	voltage: V1,
	current: I1
};

globalThis.V2 = { real: -1.2938578e-4, imag: -8.0598078e-4 };
globalThis.I2 = { real:  2.5992959e-6, imag: -3.8725388e-6 };
globalThis.generator_side_sim_vals_reverse_setup = {
	voltage: V2,
	current: I2
};

const s_params_load_side = get_s_params_from_simulated_circuit(generator_side_sim_vals_reverse_setup, load_side_sim_vals_reverse_setup, tlWaveParams.z0_magnitude, true);
S22 = s_params_load_side.S22;
S12 = s_params_load_side.S12;

signalFlowVals = findSignalFlowNodeValues(
	generator,
	load_impedance,
	S11,
	S21,
	S12,
	S22,
	tlWaveParams.z0_magnitude,
	tlWaveParams.beta
);
console.log(signalFlowVals);

const circuit_voltages = convert_signal_flow_node_vals_to_voltage_current_vals(signalFlowVals, tlWaveParams.z0_magnitude);
// console.log(circuit_voltages);

/*
const matching_impedance_generator_side = match_gammaIn_at_generator(signalFlowVals, generator, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
const matching_LC_components_generator_side = find_LC_components_to_obtain_target_impedance(matching_impedance_generator_side.conjugate_impedance_at_tl1_length, generator.generator_impedance_real, frequency);
const matching_LC_components_generator_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
	matching_impedance_generator_side.conjugate_impedance_at_tl1_length, 
	{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
	frequency
);
const matching_T_config_LC_components_generator_side = find_parallel_series_LC_components_to_obtain_target_impedance(
	matching_impedance_generator_side.conjugate_impedance_at_tl1_length, 
	{real: generator.generator_impedance_real, imag: generator.generator_impedance_imag},
	frequency
);
// console.log('matching_impedance_generator_side.conjugate_impedance_at_tl1_length', matching_impedance_generator_side.conjugate_impedance_at_tl1_length);
// console.log('matching_LC_components_generator_side', matching_LC_components_generator_side);
// console.log('matching_LC_components_generator_side_v2', matching_LC_components_generator_side_v2);
// console.log('matching_T_config_LC_components_generator_side', matching_T_config_LC_components_generator_side);
const matching_impedance_load_side = match_gammaOut_at_load(signalFlowVals, generator, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
const matching_LC_components_load_side = find_LC_components_to_obtain_target_impedance(matching_impedance_load_side.conjugate_impedance_at_tl2_length, load_impedance.real, frequency);
const matching_LC_components_load_side_v2 = find_series_parallel_LC_components_to_obtain_target_impedance_V2(
	matching_impedance_load_side.conjugate_impedance_at_tl2_length, 
	{real: load_impedance.real, imag: load_impedance.imag},
	frequency
);
const matching_T_config_LC_components_load_side = find_parallel_series_LC_components_to_obtain_target_impedance(
	matching_impedance_load_side.conjugate_impedance_at_tl2_length, 
	{real: load_impedance.real, imag: load_impedance.imag},
	frequency
);
// console.log('matching_impedance_load_side', matching_impedance_load_side);
// console.log('matching_LC_components_load_side', matching_LC_components_load_side);
// console.log('matching_LC_components_load_side_v2', matching_LC_components_load_side_v2);
// console.log('matching_T_config_LC_components_load_side', matching_T_config_LC_components_load_side);
*/

/*let bileteral_match_at_port = false;
console.log('bileteral_match_at_port', bileteral_match_at_port);
let bilateral_matching = find_bilateral_match_numerically(generator, load_impedance, S11, S21, S12, S22, bileteral_match_at_port, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
let thevenin_equivalents_of_matched_configs = globalThis.get_thevenin_equivalents_of_matching_configs(bilateral_matching, bileteral_match_at_port, generator, load_impedance, frequency, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);*/

bileteral_match_at_port = true;
console.log('bileteral_match_at_port', bileteral_match_at_port);
bilateral_matching = find_bilateral_match_numerically(generator, load_impedance, S11, S21, S12, S22, bileteral_match_at_port, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
thevenin_equivalents_of_matched_configs = globalThis.get_thevenin_equivalents_of_matching_configs(bilateral_matching, bileteral_match_at_port, generator, load_impedance, frequency, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);

const voltages_load_side_port = get_load_voltage_for_impedance_matched_configs(thevenin_equivalents_of_matched_configs, bilateral_matching, S11, S21, S12, S22, frequency, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);

const voltages_across_actual_load = globalThis.extract_voltage_across_load(voltages_load_side_port, thevenin_equivalents_of_matched_configs, load_impedance, generator.generator_tl2_length, frequency, tlWaveParams.z0_magnitude, tlWaveParams.beta);
console.log(voltages_across_actual_load);
