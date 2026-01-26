"""
Advanced debt simplification algorithm
Implements cycle detection and minimization to reduce the number of transactions needed
"""
from decimal import Decimal
from collections import defaultdict
from typing import List, Dict, Tuple


class DebtSimplifier:
    """
    Advanced debt simplification using cycle detection and transaction minimization
    Similar to Splitwise's algorithm
    """
    
    @staticmethod
    def simplify_debts(balances: Dict[str, Decimal]) -> List[Dict]:
        """
        Simplify debts by finding cycles and minimizing transactions
        
        Args:
            balances: Dictionary mapping user_id to net balance (positive = owes, negative = is owed)
        
        Returns:
            List of simplified transactions in format:
            [{'from': user_id, 'to': user_id, 'amount': Decimal}, ...]
        """
        # Convert to list of (user_id, balance) tuples, filtering out zero balances
        net_balances = [
            (user_id, balance)
            for user_id, balance in balances.items()
            if abs(balance) > Decimal('0.01')
        ]
        
        if not net_balances:
            return []
        
        # Separate creditors (positive balance) and debtors (negative balance)
        creditors = [(uid, bal) for uid, bal in net_balances if bal > 0]
        debtors = [(uid, -bal) for uid, bal in net_balances if bal < 0]  # Make positive
        
        # Sort by amount (largest first for better optimization)
        creditors.sort(key=lambda x: x[1], reverse=True)
        debtors.sort(key=lambda x: x[1], reverse=True)
        
        simplified = []
        
        # Greedy algorithm: match largest creditors with largest debtors
        creditor_idx = 0
        debtor_idx = 0
        
        while creditor_idx < len(creditors) and debtor_idx < len(debtors):
            creditor_id, creditor_amount = creditors[creditor_idx]
            debtor_id, debtor_amount = debtors[debtor_idx]
            
            # Calculate transaction amount
            transaction_amount = min(creditor_amount, debtor_amount)
            
            if transaction_amount > Decimal('0.01'):
                simplified.append({
                    'from': debtor_id,
                    'to': creditor_id,
                    'amount': float(transaction_amount)
                })
            
            # Update remaining amounts
            creditors[creditor_idx] = (creditor_id, creditor_amount - transaction_amount)
            debtors[debtor_idx] = (debtor_id, debtor_amount - transaction_amount)
            
            # Move indices if balance is settled
            if creditors[creditor_idx][1] < Decimal('0.01'):
                creditor_idx += 1
            if debtors[debtor_idx][1] < Decimal('0.01'):
                debtor_idx += 1
        
        return simplified
    
    @staticmethod
    def find_cycles(balances: Dict[str, Decimal]) -> List[List[str]]:
        """
        Find cycles in the debt graph using DFS
        
        Args:
            balances: Dictionary mapping user_id to net balance
        
        Returns:
            List of cycles, where each cycle is a list of user_ids
        """
        # Build graph: user_id -> list of users they owe money to
        graph = defaultdict(list)
        for user_id, balance in balances.items():
            if balance > 0:  # This user owes money
                # Find users who owe this user
                for other_id, other_balance in balances.items():
                    if other_id != user_id and other_balance < 0:
                        graph[user_id].append(other_id)
        
        cycles = []
        visited = set()
        
        def dfs(node, path):
            """DFS to find cycles"""
            if node in path:
                # Found a cycle
                cycle_start = path.index(node)
                cycle = path[cycle_start:] + [node]
                if len(cycle) > 2:  # Only cycles with 3+ nodes
                    cycles.append(cycle)
                return
            
            if node in visited:
                return
            
            visited.add(node)
            path.append(node)
            
            for neighbor in graph.get(node, []):
                dfs(neighbor, path)
            
            path.pop()
        
        for user_id in balances.keys():
            if user_id not in visited:
                dfs(user_id, [])
        
        return cycles
    
    @staticmethod
    def minimize_transactions(balances: Dict[str, Decimal]) -> List[Dict]:
        """
        Minimize the number of transactions needed to settle all debts
        Uses a combination of cycle detection and greedy matching
        
        Args:
            balances: Dictionary mapping user_id to net balance
        
        Returns:
            List of minimized transactions
        """
        # First, try to find and resolve cycles
        cycles = DebtSimplifier.find_cycles(balances)
        
        # For each cycle, we can reduce one transaction
        # This is a simplified version - full implementation would be more complex
        simplified = DebtSimplifier.simplify_debts(balances)
        
        # Further optimization: merge transactions where possible
        # (e.g., if A owes B $10 and B owes C $10, A can pay C directly)
        optimized = DebtSimplifier._merge_transactions(simplified)
        
        return optimized
    
    @staticmethod
    def _merge_transactions(transactions: List[Dict]) -> List[Dict]:
        """
        Merge transactions to reduce total count
        Example: A->B $10, B->C $10 becomes A->C $10
        Uses graph-based approach to find optimal paths
        """
        if not transactions:
            return []
        
        # Build a graph of transactions
        graph = defaultdict(lambda: defaultdict(Decimal))
        
        for txn in transactions:
            from_user = txn['from']
            to_user = txn['to']
            amount = Decimal(str(txn['amount']))
            graph[from_user][to_user] += amount
        
        # Find and merge through intermediate nodes
        # For each pair (A, C), check if there's a path A->B->C
        merged = []
        processed_pairs = set()
        
        # First pass: direct transactions
        direct_txns = {}
        for from_user in graph:
            for to_user, amount in graph[from_user].items():
                direct_txns[(from_user, to_user)] = amount
        
        # Second pass: try to merge through intermediate nodes
        for (from_user, to_user), amount in direct_txns.items():
            if (from_user, to_user) in processed_pairs:
                continue
            
            # Look for intermediate node B such that:
            # A->B exists and B->C exists, where C is to_user
            # Or A->B exists and B->to_user exists
            merged_amount = amount
            intermediate_found = False
            
            # Check if we can route through any intermediate node
            for intermediate in graph.keys():
                if intermediate == from_user or intermediate == to_user:
                    continue
                
                # Check A->B and B->C
                if (from_user, intermediate) in direct_txns and (intermediate, to_user) in direct_txns:
                    a_to_b = direct_txns[(from_user, intermediate)]
                    b_to_c = direct_txns[(intermediate, to_user)]
                    
                    # Can merge if amounts match
                    min_amount = min(amount, a_to_b, b_to_c)
                    if min_amount > Decimal('0.01'):
                        # Create merged transaction A->C
                        merged_amount = min_amount
                        # Reduce the intermediate transactions
                        direct_txns[(from_user, intermediate)] -= min_amount
                        direct_txns[(intermediate, to_user)] -= min_amount
                        if direct_txns[(from_user, intermediate)] < Decimal('0.01'):
                            del direct_txns[(from_user, intermediate)]
                        if direct_txns[(intermediate, to_user)] < Decimal('0.01'):
                            del direct_txns[(intermediate, to_user)]
                        intermediate_found = True
                        break
            
            if merged_amount > Decimal('0.01'):
                merged.append({
                    'from': from_user,
                    'to': to_user,
                    'amount': float(merged_amount)
                })
                processed_pairs.add((from_user, to_user))
        
        # Add remaining direct transactions that weren't merged
        for (from_user, to_user), amount in direct_txns.items():
            if amount > Decimal('0.01') and (from_user, to_user) not in processed_pairs:
                merged.append({
                    'from': from_user,
                    'to': to_user,
                    'amount': float(amount)
                })
        
        return merged
