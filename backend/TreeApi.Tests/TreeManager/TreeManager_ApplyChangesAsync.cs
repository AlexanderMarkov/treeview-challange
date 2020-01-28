using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TreeApi.Models;
using Xunit;
using FluentAssertions;
using TreeApi.Services;
using System.Collections.Generic;

namespace TreeApi.Tests
{
	public class TreeManager_ApplyChangesAsync_Should
	{
		[Fact]
		public async Task CascadeMarkAsRemoved()
		{
			var provider = new TestTreeDbContextProvider(nameof(CascadeMarkAsRemoved));

			using (var context = provider.CreateContext())
			{
				await context.Nodes.AddAsync(new Node
				{
					Id = 1,
					Children =
					{
						new Node
						{
							Id = 2,
							Children =
							{
								new Node { Id = 21 },
								new Node
								{
									Id = 22,
									Children =
									{
										new Node { Id = 221 }
									}
								}
							}
						},
						new Node { Id = 3 }
					}
				});
				await context.SaveChangesAsync();
			}

			var manager = new TreeManager(provider);
			await manager.ApplyChangesAsync(new ChangeModel
			{
				NodesToRemove = new HashSet<long>() { 2 }
			});

			using (var context = provider.CreateContext())
			{
				var all = await context.Nodes.ToListAsync();
				var node = await context.Nodes.SingleAsync(x => x.Id == 1);
				node.Should().BeEquivalentTo(new Node
				{
					Id = 1,
					IsRemoved = false,
					Children =
					{
						new Node
						{
							Id = 2,
							IsRemoved = true,
							Children =
							{
								new Node { Id = 21, IsRemoved = true},
								new Node
								{
									Id = 22,
									IsRemoved = true,
									Children =
									{
										new Node { Id = 221, IsRemoved = true }
									}
								}
							}
						},
						new Node { Id = 3, IsRemoved = false }
					}
				} , o => o.Excluding(x => x.SelectedMemberPath.Contains("Parent")).IgnoringCyclicReferences());
			}
		}
	}
}
