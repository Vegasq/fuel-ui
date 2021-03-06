/*
 * Copyright 2016 Mirantis, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 **/

import registerSuite from 'intern!object';
import Common from 'tests/functional/pages/common';
import ClusterPage from 'tests/functional/pages/cluster';
import NetworksLib from 'tests/functional/nightly/library/networks';

registerSuite(() => {
  var common,
    clusterPage,
    clusterName,
    networksLib;

  return {
    name: 'Neutron VLAN segmentation',
    setup() {
      common = new Common(this.remote);
      clusterPage = new ClusterPage(this.remote);
      networksLib = new NetworksLib(this.remote);
      clusterName = common.pickRandomName('VLAN Cluster');

      return this.remote
        .then(() => common.getIn())
        .then(() => common.createCluster(clusterName))
        .then(() => common.addNodesToCluster(1, ['Controller']))
        .then(() => common.addNodesToCluster(1, ['Compute']))
        .then(() => clusterPage.goToTab('Networks'));
    },
    'Storage Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var networkName = 'Storage';
      var correctIpRange = ['192.168.1.5', '192.168.1.10'];
      var newIpRange = ['192.168.1.25', '192.168.1.30'];
      return this.remote
        .then(() => networksLib.checkNetworkInitialState(networkName))
        .then(() => networksLib.checkNetrworkIpRanges(networkName, correctIpRange, newIpRange));
    },
    'Management Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var networkName = 'Management';
      var correctIpRange = ['192.168.0.55', '192.168.0.100'];
      var newIpRange = ['192.168.0.120', '192.168.0.170'];
      return this.remote
        .then(() => networksLib.checkNetworkInitialState(networkName))
        .then(() => networksLib.checkNetrworkIpRanges(networkName, correctIpRange, newIpRange));
    },
    'Check intersections between all networks'() {
      this.timeout = 45000;
      return this.remote
        // Storage and Management
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Management', ['192.168.0.0/24', '192.168.0.1', '192.168.0.254']
          )
        )
        // Storage and Public
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Public', ['172.16.0.0/24', '172.16.0.5', '172.16.0.120']
          )
        )
        // Storage and Floating IP
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Public', ['172.16.0.0/24', '172.16.0.135', '172.16.0.170']
          )
        )
        // Management and Public
        .then(
          () => networksLib.checkNerworksIntersection(
            'Management', 'Public', ['172.16.0.0/24', '172.16.0.5', '172.16.0.120']
          )
        )
        // Management and Floating IP
        .then(
          () => networksLib.checkNerworksIntersection(
            'Management', 'Public', ['172.16.0.0/24', '172.16.0.135', '172.16.0.170']
          )
        );
    }
  };
});

registerSuite(() => {
  var common,
    clusterPage,
    clusterName,
    networksLib;

  return {
    name: 'Neutron tunneling segmentation',
    setup() {
      common = new Common(this.remote);
      clusterPage = new ClusterPage(this.remote);
      networksLib = new NetworksLib(this.remote);
      clusterName = common.pickRandomName('Tunneling Cluster');

      return this.remote
        .then(() => common.getIn())
        .then(
          () => common.createCluster(
            clusterName,
            {
              'Networking Setup'() {
                return this.remote
                  .clickByCssSelector('input[value*="neutron"][value$=":vlan"]')
                  .clickByCssSelector('input[value*="neutron"][value$=":tun"]');
              }
            }
          )
        )
        .then(() => common.addNodesToCluster(1, ['Controller']))
        .then(() => common.addNodesToCluster(1, ['Compute']))
        .then(() => clusterPage.goToTab('Networks'));
    },
    'Storage Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var networkName = 'Storage';
      var correctIpRange = ['192.168.1.5', '192.168.1.10'];
      var newIpRange = ['192.168.1.25', '192.168.1.30'];
      return this.remote
        .then(() => networksLib.checkNetworkInitialState(networkName))
        .then(() => networksLib.checkNetrworkIpRanges(networkName, correctIpRange, newIpRange));
    },
    'Management Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var networkName = 'Management';
      var correctIpRange = ['192.168.0.55', '192.168.0.100'];
      var newIpRange = ['192.168.0.120', '192.168.0.170'];
      return this.remote
        .then(() => networksLib.checkNetworkInitialState(networkName))
        .then(() => networksLib.checkNetrworkIpRanges(networkName, correctIpRange, newIpRange));
    },
    'Private Network "IP Ranges" testing'() {
      this.timeout = 45000;
      var networkName = 'Private';
      var correctIpRange = ['192.168.2.190', '192.168.2.200'];
      var newIpRange = ['192.168.2.200', '192.168.2.230'];
      return this.remote
        .then(() => networksLib.checkNetworkInitialState(networkName))
        .then(() => networksLib.checkNetrworkIpRanges(networkName, correctIpRange, newIpRange));
    },
    'Check intersections between all networks'() {
      this.timeout = 60000;
      return this.remote
        // Storage and Management
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Management', ['192.168.0.0/24', '192.168.0.1', '192.168.0.254']
          )
        )
        // Storage and Private
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Private', ['192.168.2.0/24', '192.168.2.1', '192.168.2.254']
          )
        )
        // Storage and Public
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Public', ['172.16.0.0/24', '172.16.0.5', '172.16.0.120']
          )
        )
        // Storage and Floating IP
        .then(
          () => networksLib.checkNerworksIntersection(
            'Storage', 'Public', ['172.16.0.0/24', '172.16.0.135', '172.16.0.170']
          )
        )
        // Management and Public
        .then(
          () => networksLib.checkNerworksIntersection(
            'Management', 'Public', ['172.16.0.0/24', '172.16.0.5', '172.16.0.120']
          )
        )
        // Management and Floating IP
        .then(
          () => networksLib.checkNerworksIntersection(
            'Management', 'Public', ['172.16.0.0/24', '172.16.0.135', '172.16.0.170']
          )
        )
        // Private and Public
        .then(
          () => networksLib.checkNerworksIntersection(
            'Private', 'Public', ['172.16.0.0/24', '172.16.0.5', '172.16.0.120']
          )
        )
        // Private and Floating IP
        .then(
          () => networksLib.checkNerworksIntersection(
            'Private', 'Public', ['172.16.0.0/24', '172.16.0.135', '172.16.0.170']
          )
        );
    }
  };
});
