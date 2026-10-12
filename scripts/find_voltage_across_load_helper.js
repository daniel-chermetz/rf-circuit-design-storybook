globalThis.find_TL_waves_at_distance_from_current_position = (a, b, distance_away_from_port, beta) => {
	const a_at_distance =  multiplyComplexNums_v2(
		a,
		{
			real: Math.cos(beta * distance_away_from_port),
			imag: Math.sin(beta * distance_away_from_port)
		}
	);

	const b_at_distance =  multiplyComplexNums_v2(
		b,
		{
			real: Math.cos(-beta * distance_away_from_port),
			imag: Math.sin(-beta * distance_away_from_port)
		}
	);

	return {
		a: a_at_distance,
		b: b_at_distance,
		total: addComplexNums(a_at_distance, b_at_distance)
	}
}

globalThis.extract_voltage_across_load_L_match_at_port = (voltages_load_side, impedance_match, load, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}	
	
	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_1 
	};
	const parallel_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2				
	}

	const b2_current = divideComplexNums_v2(
		voltages_load_side.b2,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		voltages_load_side.a2,
		z0_complex
	);
	const load_side_port_current = addComplexNums(a2_current, b2_current);
	load_side_port_current.real *= -1;
	load_side_port_current.imag *= -1;

	const load_side_shunt_current = divideComplexNums_v2(voltages_load_side.total, parallel_reactance);

	const load_side_series_current = subtractComplexNums(load_side_port_current, load_side_shunt_current);

	const voltage_across_series_reactance = multiplyComplexNums_v2(load_side_series_current, series_reactance);
	const voltage_at_load_TL_entry_on_port_side = subtractComplexNums(voltages_load_side.total, voltage_across_series_reactance);
	console.log('voltage_at_load_TL_entry_on_port_side', voltage_at_load_TL_entry_on_port_side);

	const current_at_load_TL_entry_on_port_side = load_side_series_current;
	console.log('current_at_load_TL_entry_on_port_side', current_at_load_TL_entry_on_port_side);

	//  V + Z0 * I = 2V+
	// Z0 * I = Z0 * I+ + Z0 * I- = V+ - V-
	// and then: V = V+ + V-

	const V_plus = addComplexNums(
		voltage_at_load_TL_entry_on_port_side,
		{
			real: current_at_load_TL_entry_on_port_side.real * z0_magnitude,
			imag: current_at_load_TL_entry_on_port_side.imag * z0_magnitude
		}
	)
	V_plus.real /= 2;
	V_plus.imag /= 2;

	const umatched_load_reflection = divideComplexNums(
		load.real - z0_magnitude,
		load.imag,
		load.real + z0_magnitude,
		load.imag
	);
	const umatched_load_reflection_at_port = multiplyComplexNums_v2(
		umatched_load_reflection,
		{
			real: Math.cos(-2 * beta * tl_length_load_side),
			imag: Math.sin(-2 * beta * tl_length_load_side)					
		}
	);	

	const V_minus = multiplyComplexNums_v2(V_plus, umatched_load_reflection_at_port);

	const V_plus_at_load = multiplyComplexNums_v2(
		V_plus,
		{
			real: Math.cos(-beta * tl_length_load_side),
			imag: Math.sin(-beta * tl_length_load_side)
		}
	);
	const V_minus_at_load = multiplyComplexNums_v2(
		V_minus,
		{
			real: Math.cos(beta * tl_length_load_side),
			imag: Math.sin(beta * tl_length_load_side)
		}
	);
	const voltage_across_actual_load = addComplexNums(V_plus_at_load, V_minus_at_load);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;			
	console.log('voltages_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}
globalThis.extract_voltage_across_load_T_match_at_port = (voltages_load_side, impedance_match, load, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}

	const voltage_pre_tl_at_load_port = voltages_load_side.total;

	const b2_current = divideComplexNums_v2(
		voltages_load_side.b2,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		voltages_load_side.a2,
		z0_complex
	);

	const current_pre_tl_at_load_port = addComplexNums(a2_current, b2_current);
	current_pre_tl_at_load_port.real *= -1;
	current_pre_tl_at_load_port.imag *= -1;	

	const parallel_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_1
	};	
	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2
	};

	const voltage_across_series_reactance = multiplyComplexNums_v2(current_pre_tl_at_load_port, series_reactance);
	const voltage_post_matching_pre_tl = subtractComplexNums(voltage_pre_tl_at_load_port, voltage_across_series_reactance);

	const current_across_shunt_reactance = divideComplexNums_v2(voltage_post_matching_pre_tl, parallel_reactance);
	const current_post_matching_pre_tl = subtractComplexNums(current_pre_tl_at_load_port, current_across_shunt_reactance);

	//  V + Z0 * I = 2V+
	// Z0 * I = Z0 * I+ + Z0 * I- = V+ - V-
	// and then: V = V+ + V-

	const V_plus = addComplexNums(
		voltage_post_matching_pre_tl,
		{
			real: current_post_matching_pre_tl.real * z0_magnitude,
			imag: current_post_matching_pre_tl.imag * z0_magnitude
		}
	)
	V_plus.real /= 2;
	V_plus.imag /= 2;

	const umatched_load_reflection = divideComplexNums(
		load.real - z0_magnitude,
		load.imag,
		load.real + z0_magnitude,
		load.imag
	);
	const umatched_load_reflection_at_port = multiplyComplexNums_v2(
		umatched_load_reflection,
		{
			real: Math.cos(-2 * beta * tl_length_load_side),
			imag: Math.sin(-2 * beta * tl_length_load_side)					
		}
	);	

	const V_minus = multiplyComplexNums_v2(V_plus, umatched_load_reflection_at_port);

	const V_plus_at_load = multiplyComplexNums_v2(
		V_plus,
		{
			real: Math.cos(-beta * tl_length_load_side),
			imag: Math.sin(-beta * tl_length_load_side)
		}
	);
	const V_minus_at_load = multiplyComplexNums_v2(
		V_minus,
		{
			real: Math.cos(beta * tl_length_load_side),
			imag: Math.sin(beta * tl_length_load_side)
		}
	);
	const voltage_across_actual_load = addComplexNums(V_plus_at_load, V_minus_at_load);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;			
	console.log('voltages_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}
globalThis.extract_voltage_across_load_L_match_at_load = (voltages_load_side, impedance_match, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}

	const voltage_post_tl_at_load_distance = find_TL_waves_at_distance_from_current_position(voltages_load_side.a2, voltages_load_side.b2, tl_length_load_side, beta);

	const b2_current = divideComplexNums_v2(
		voltage_post_tl_at_load_distance.b,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		voltage_post_tl_at_load_distance.a,
		z0_complex
	);
	const current_post_tl_at_load_distance = addComplexNums(a2_current, b2_current);
	current_post_tl_at_load_distance.real *= -1;
	current_post_tl_at_load_distance.imag *= -1;

	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_1
	};
	const parallel_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2
	};	

	const load_side_shunt_current = divideComplexNums_v2(voltage_post_tl_at_load_distance.total, parallel_reactance);
	const load_side_series_current = subtractComplexNums(current_post_tl_at_load_distance, load_side_shunt_current);

	const voltage_across_series_reactance = multiplyComplexNums_v2(load_side_series_current, series_reactance);

	const voltage_across_actual_load = subtractComplexNums(voltage_post_tl_at_load_distance.total, voltage_across_series_reactance);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;
	// console.log('voltages_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}
globalThis.extract_voltage_across_load_T_match_at_load = (voltages_load_side, impedance_match, tl_length_load_side, z0_magnitude, beta) => {
	const z0_complex = {
		real: z0_magnitude,
		imag: 0
	}
	const z0_complex_negative = {
		real: -z0_magnitude,
		imag: 0
	}
	
	const a2_post_tl_at_load = multiplyComplexNums_v2(
		voltages_load_side.a2,
		{
			real: Math.cos(beta * tl_length_load_side),
			imag: Math.sin(beta * tl_length_load_side)
		}
	);
	const b2_post_tl_at_load = multiplyComplexNums_v2(
		voltages_load_side.b2,
		{
			real: Math.cos(-beta * tl_length_load_side),
			imag: Math.sin(-beta * tl_length_load_side)
		}
	);

	const voltage_post_tl_at_load = addComplexNums(a2_post_tl_at_load, b2_post_tl_at_load);	

	const b2_current = divideComplexNums_v2(
		b2_post_tl_at_load,
		z0_complex_negative
	)
	const a2_current = divideComplexNums_v2(
		a2_post_tl_at_load,
		z0_complex
	);

	const current_post_tl_at_load = addComplexNums(a2_current, b2_current);
	current_post_tl_at_load.real *= -1;
	current_post_tl_at_load.imag *= -1;

	const series_reactance = {
		real: 0,
		imag: impedance_match.components.reactance_2
	};

	const voltage_across_series_reactance = multiplyComplexNums_v2(current_post_tl_at_load, series_reactance);
	const voltage_across_actual_load = subtractComplexNums(voltage_post_tl_at_load, voltage_across_series_reactance);
	const voltage_across_actual_load_polar = convert_complex_num_from_cartesian_to_polar(voltage_across_actual_load.real, voltage_across_actual_load.imag);
	voltage_across_actual_load.magnitude = voltage_across_actual_load_polar.magnitude;
	voltage_across_actual_load.theta = voltage_across_actual_load_polar.theta;			
	console.log('voltage_across_actual_load', voltage_across_actual_load);

	return voltage_across_actual_load;
}
