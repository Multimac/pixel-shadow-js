uniform sampler2D texture;
uniform float pixelSize;

varying vec2 v_uv;

void main()
{
	vec2 colorA = texture2D(texture, v_uv - vec2(pixelSize * 1.5, 0.0)).rg;
	vec2 colorB = texture2D(texture, v_uv - vec2(pixelSize * 0.5, 0.0)).rg;
	vec2 colorC = texture2D(texture, v_uv + vec2(pixelSize * 0.5, 0.0)).rg;
	vec2 colorD = texture2D(texture, v_uv + vec2(pixelSize * 1.5, 0.0)).rg;

	gl_FragColor = vec4(min(
		min(colorA, colorB),
		min(colorC, colorD)
	), 0.0, 1.0);
}