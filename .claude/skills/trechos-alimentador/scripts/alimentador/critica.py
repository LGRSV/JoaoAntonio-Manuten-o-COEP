"""Interrupções da Crítica (Critica*.txt) somadas por trecho: NAE (coletivas) e individuais.

Leitura (ver bases.md do usuário): separador ';', latin-1, sem tratamento de aspas, mapear colunas pelo nome.
Uma linha é um passo de manobra; a ocorrência é NUM_SEQ_OPER_INIC_HDE. O mês é a competência (DTA_CMPT_HDE),
não a data de abertura: o arquivo de um mês traz linhas de competência do mês seguinte, e há linhas repetidas
entre arquivos (descartadas).

Onde cai cada ocorrência:
    - DJ (ABRANGÊNCIA = DJ): T1.
    - Ativo do problema que abre um trecho (religador ou fusível): esse trecho.
    - Senão, o ativo (do problema ou interrompido) com ponto no cadastro: trecho do vão mais próximo.
      Individual (UC) cai pelo trafo que atende o consumidor.
    - Ativo que não está no cadastro atual: fora dos trechos ("hoje no <outro alimentador>" quando achado
      no KML de outro alimentador passado em `outros`).
O número da UC (consumidor) não é guardado.
"""
import csv
import re
from collections import OrderedDict

from .regras import haversine

csv.field_size_limit(10**7)


def ler(arquivos, alimentador):
    """Linhas do alimentador, sem repetição, de todos os arquivos."""
    vistas, linhas = set(), []
    for arq in arquivos:
        with open(arq, encoding='latin-1', newline='') as fh:
            r = csv.reader(fh, delimiter=';', quoting=csv.QUOTE_NONE)
            cab = next(r)
            for row in r:
                if len(row) != len(cab) or tuple(row) in vistas:
                    continue
                vistas.add(tuple(row))
                d = dict(zip(cab, row))
                if d['COD_ALIMENTADOR'].strip() == alimentador:
                    linhas.append(d)
    return linhas


def pontos_kml(arq):
    """nome → (lat, lon) de todo Placemark de ponto do KML (chaves e transformadores)."""
    s = open(arq, encoding='utf-8', errors='replace').read()
    out = {}
    for nome, lon, lat in re.findall(r'<Placemark>\s*<name>([^<]+)</name>.*?<Point>\s*<coordinates>\s*([-\d.]+),([-\d.]+)',
                                     s, re.S):
        out.setdefault(nome.strip(), (float(lat), float(lon)))
    return out


def _num(x):
    x = x.strip().replace(',', '.')
    return float(x) if x not in ('', '.') else 0.0


def _data(s):   # 'dd/mm/aaaa hh:mm' → 'aaaa-mm-dd hh:mm' (ordena)
    return f'{s[6:10]}-{s[3:5]}-{s[:2]}{s[10:16]}'


def ocorrencias(linhas):
    """Agrupa os passos por ocorrência e mês de competência."""
    oc = OrderedDict()
    for d in sorted(linhas, key=lambda d: _data(d['DTA_ABERT'])):
        cmpt = d['DTA_CMPT_HDE'].strip()            # dd/mm/aa
        k = (d['NUM_SEQ_OPER_INIC_HDE'], cmpt)
        o = oc.get(k)
        if o is None:
            o = oc[k] = dict(
                mes=f'20{cmpt[6:8]}-{cmpt[3:5]}', abert=_data(d['DTA_ABERT']), coletiva=d['TIPO_INTER_KTI'].startswith('COLE'),
                abr=d['ABRANGÊNCIA'].strip(), prob=d['COD_ELE_PROBLEMA'].strip(), prob_tipo=d['COD_ELE_REDE_PROBLEMA'].strip(),
                inter=d['COD_ELE_INTERROMPIDO'].strip(), inter_tipo=d['COD_ELE_REDE_INTERROMPIDO'].strip(),
                causa=d['DES_CAUSA_INTER_CAU'].strip().capitalize(), sub=d['DES_SUB_CAUSA_INTER_SCR'].strip().capitalize(),
                programada='PROGRAMADA' in d['DES_CAUSA_INTER_CAU'], cons=0, chi=0.0, dur=0, fec=0.0, dec=0.0)
        c = int(_num(d['QTD_CONS_INTER_FAT']))
        o['cons'] += c
        o['chi'] += c * _num(d['DURACAO']) / 60
        o['dur'] = max(o['dur'], int(_num(d['DURACAO'])))
        o['fec'] += _num(d['QTD_IFEC_ALIM'])
        o['dec'] += _num(d['QTD_IDEC_ALIM'])
    for o in oc.values():
        if o['prob_tipo'] == 'UC':                  # não guarda o número do consumidor
            o['prob'] = ''
    return list(oc.values())


def por_trecho(oc, res, ts, pontos, outros=None):
    """Põe em cada ocorrência o trecho (ou o motivo de ficar fora) e o ativo usado para localizar."""
    inicio = {t['inicio']: t['nome'] for t in ts}
    perto = {}

    def trecho_do_ponto(cod):
        if cod not in perto:
            p = pontos[cod]
            perto[cod] = min(res['vaos'], key=lambda v: min(haversine(p, v['a']), haversine(p, v['b'])))['trecho']
        return perto[cod]

    for o in oc:
        if o['abr'] == 'DJ':
            o['trecho'], o['ativo'] = 'T1', o['prob']
        elif o['prob'] in inicio:
            o['trecho'], o['ativo'] = inicio[o['prob']], o['prob']
        else:
            achado = next((c for c in (o['prob'], o['inter']) if c and c in pontos), None)
            if achado:
                o['trecho'], o['ativo'] = trecho_do_ponto(achado), achado
            else:
                o['ativo'] = o['prob'] or o['inter']
                onde = next((nome for nome, pts in (outros or {}).items() if o['ativo'] in pts), None)
                o['trecho'] = None
                o['fora'] = f'hoje no {onde}' if onde else 'fora do cadastro atual'
    return oc
