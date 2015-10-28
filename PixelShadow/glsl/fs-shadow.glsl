uniform sampler2D texture;
uniform float pixelSize;
uniform float bias;

varying vec2 v_uv;

vec2 GetShadowDist(vec2 uv)
{
	float u0 = abs(uv.x - 0.5) * 2.0;

	vec2 transUV = vec2(uv.x, (uv.y - 0.5) * 2.0);

	transUV.y /= u0;
	transUV.y = (transUV.y + 1.0) / 2.0;

	return texture2D(texture, transUV).rg;
}

void main()
{
	float dist = length(v_uv - 0.5) * 2.0;

	dist -= bias * pixelSize;

	float nX = (v_uv.x - 0.5) * 2.0;
	float nY = (v_uv.y - 0.5) * 2.0;

	float shadowMapDist;
	if (abs(nX) > abs(nY))
		shadowMapDist = GetShadowDist(v_uv.xy).r;
	else
		shadowMapDist = GetShadowDist(v_uv.yx).g;

	float light = dist < shadowMapDist ? 1.0 : 0.0;
	
	gl_FragColor = vec4(light, 0.0, dist, 1.0);
}