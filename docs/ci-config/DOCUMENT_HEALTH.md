# Métricas de salud documental

## Métricas

1. **Cobertura de módulos** = módulos con mapping/documento / módulos detectados.
2. **Frescura** = módulos cuyo doc no es anterior al último cambio del código.
3. **Completitud** = score 0–100:
   - 60 puntos cobertura;
   - 20 puntos frescura;
   - 20 puntos existencia de docs fundacionales.
4. **Edad** = días desde último commit de cada documento.

## Objetivos

- Cobertura: 100%.
- Completitud: 100 antes de producción.
- Doc más vieja que código: 0 módulos en PR de release.
- Documentos fundacionales ausentes: 0.

CI falla por cobertura faltante o documentos requeridos ausentes. La frescura también se refuerza mediante validación por diff en PR.
