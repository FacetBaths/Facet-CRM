#!/bin/bash

cd /home/proto/facet/Dev/facet-crm/server
nohup npm run dev > server.log 2>&1 &

cd /home/proto/facet/Dev/facet-crm/client
nohup npm run dev > client.log 2>&1 &
