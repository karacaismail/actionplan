# -*- coding: utf-8 -*-
"""Scale cluster düğümleri için ÖZGÜN 14 boyut + 7 faz içeriği.
Sadece dimensions/phases ve plan alanları yeniden yazılır; kimlik/ilişki korunur.
"""
import json, os, glob, sys

NODES_DIR = "src/data/generated/nodes"

# 14 boyut anahtarı (sıra schema ile aynı)
DIM_KEYS = ["featureDefs","security","codeOptimization","securityOptimization",
            "performance","mobileApps","wcag","deployment","eca","aiAgents",
            "testing","owasp","integration","moduleUsage"]
DIM_TITLE = {
 "featureDefs":"Özellik Tanımları","security":"Güvenlik Önlemleri",
 "codeOptimization":"Kod Optimizasyonu","securityOptimization":"Güvenlik Optimizasyonu",
 "performance":"Performans Optimizasyonu","mobileApps":"Mobil Uygulama Uyumu",
 "wcag":"WCAG 2.2 AAA","deployment":"Dağıtım (Swarm/K8s/Shared)",
 "eca":"ECA Kuralları","aiAgents":"AI Ajan Davranışı","testing":"Testler & QA",
 "owasp":"OWASP & Standartlar","integration":"Kernel/Core Entegrasyonu",
 "moduleUsage":"Modül Kullanımı"}

PHASE_KEYS = ["requirements","test-plan","db-schema","development",
              "test-qa","verification","release-maintenance"]

# Her düğüm için: 14 boyut maddeleri + 7 faz DoD + plan alanları.
# CONTENT[id] = { "dims": {key:[items]}, "phases": {key:[criteria]},
#                 "deliverables":[...], "acceptance":[...], "risks":[{...}],
#                 "effort":int, "progress":int, "status":str, "phase":str, "state":str,
#                 "phaseStatus": {phase: status} }
CONTENT = {}
